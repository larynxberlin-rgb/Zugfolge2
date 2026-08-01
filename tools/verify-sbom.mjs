// SPDX-FileCopyrightText: 2026 Zugfolge contributors
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPOSITORY_ROOT = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const EXPECTED_DOCUMENTS = ["jvm.cdx.json", "node.cdx.json", "python.cdx.json"];
const EXPECTED_EVIDENCE_FILES = [
  "jvm/jacoco.xml",
  "jvm/test-results.xml",
  "node/coverage-summary.json",
  "node/test-results.xml",
  "python/coverage.json",
  "python/coverage.xml",
  "python/test-results.json",
];
const CYCLONEDX_COMPONENT_TYPES = new Set([
  "application",
  "container",
  "cryptographic-asset",
  "data",
  "device",
  "device-driver",
  "file",
  "firmware",
  "framework",
  "library",
  "machine-learning-model",
  "operating-system",
  "platform",
]);

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function componentsByName(document) {
  const components = document.components ?? [];
  return new Map(
    components.flatMap((component) => {
      const entries = [[`${component.name}@${component.version}`, component]];
      if (component.group) {
        entries.push([`${component.group}/${component.name}@${component.version}`, component]);
      }
      return entries;
    }),
  );
}

export function validateCycloneDx(document, label) {
  assert.equal(document.bomFormat, "CycloneDX", `${label} is not CycloneDX`);
  assert.match(String(document.specVersion), /^1\.[567]$/);
  assert.ok(Number.isInteger(document.version) && document.version >= 1);
  assert.ok(document.metadata?.component, `${label} needs a root component`);
  assert.ok(
    CYCLONEDX_COMPONENT_TYPES.has(document.metadata.component.type),
    `${label} root needs a valid type`,
  );
  assert.equal(typeof document.metadata.component.name, "string", `${label} root needs a name`);
  assert.ok(Array.isArray(document.components) && document.components.length > 0);
  assert.ok(Array.isArray(document.dependencies), `${label} needs a dependency graph`);
  const references = new Set([
    document.metadata.component["bom-ref"],
    ...document.components.map((component) => component["bom-ref"]),
  ]);
  assert.ok(!references.has(undefined), `${label} contains a component without bom-ref`);
  assert.equal(references.size, document.components.length + 1, `${label} has duplicate refs`);
  for (const component of document.components) {
    assert.ok(
      CYCLONEDX_COMPONENT_TYPES.has(component.type),
      `${label} component needs a valid type`,
    );
    assert.equal(typeof component.name, "string", `${label} component needs a name`);
  }
  const rootReference = document.metadata.component["bom-ref"];
  assert.ok(
    document.dependencies.some((dependency) => dependency.ref === rootReference),
    `${label} dependency graph is not connected to its root component`,
  );
  for (const dependency of document.dependencies) {
    assert.ok(references.has(dependency.ref), `${label} dependency root is unresolved`);
    for (const target of dependency.dependsOn ?? []) {
      assert.ok(references.has(target), `${label} dependency target is unresolved`);
    }
  }
}

export function assertJvmDirectDependencies(document, catalogSource, buildSource, lockSource) {
  const catalogModules = new Map(
    [...catalogSource.matchAll(/^([a-z0-9-]+)\s*=\s*\{[^\n]*module\s*=\s*"([^"]+)"/gim)].map(
      ([, alias, module]) => [alias, module],
    ),
  );
  const directAliases = new Set(
    [...buildSource.matchAll(/\b(?:api|implementation|runtimeOnly|compileOnly|testImplementation|testRuntimeOnly)\(\s*(?:platform\()?libs\.([a-zA-Z0-9.]+)/g)].map(
      ([, accessor]) => accessor.replaceAll(".", "-"),
    ),
  );
  assert.ok(directAliases.size > 0, "JVM build declares no direct dependency aliases");
  const components = componentsByName(document);
  for (const alias of directAliases) {
    const module = catalogModules.get(alias);
    assert.ok(module, `JVM catalog does not define direct alias ${alias}`);
    const escapedModule = module.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const lockMatch = lockSource.match(new RegExp(`^${escapedModule}:([^=]+)=`, "m"));
    assert.ok(lockMatch, `JVM lock does not resolve direct module ${module}`);
    const componentName = module.replace(":", "/");
    assert.ok(
      components.has(`${componentName}@${lockMatch[1]}`),
      `JVM SBOM misses direct dependency ${module}:${lockMatch[1]}`,
    );
  }
}

export function validateEvidenceArtifactLayout(fileNames) {
  const names = new Set(fileNames);
  for (const expected of EXPECTED_EVIDENCE_FILES) {
    assert.ok(names.has(expected), `Evidence artifact misses outputs/coverage/${expected}`);
  }
}

export async function verifySbomDocuments(repositoryRoot = REPOSITORY_ROOT) {
  const sbomRoot = path.join(repositoryRoot, "outputs", "sbom");
  const coverageRoot = path.join(repositoryRoot, "outputs", "coverage");
  const evidenceEntries = await Promise.all(
    EXPECTED_EVIDENCE_FILES.map(async (name) => {
      const source = await readFile(path.join(coverageRoot, ...name.split("/")), "utf8");
      assert.ok(source.length > 0, `Evidence artifact contains an empty ${name}`);
      assert.doesNotMatch(source, /\b[A-Za-z]:[\\/]/, `${name} leaks an absolute path`);
      return name;
    }),
  );
  validateEvidenceArtifactLayout(evidenceEntries);
  const documentEntries = await Promise.all(
    EXPECTED_DOCUMENTS.map(async (name) => {
      const bytes = await readFile(path.join(sbomRoot, name));
      const source = bytes.toString("utf8");
      assert.doesNotMatch(source, /\b[A-Za-z]:[\\/]/, `${name} leaks an absolute path`);
      assert.doesNotMatch(source, /\$\{\{\s*secrets\./i, `${name} leaks a secret expression`);
      const document = JSON.parse(source);
      validateCycloneDx(document, name);
      return [name, { bytes, document }];
    }),
  );
  const documents = new Map(documentEntries);

  const packageJson = JSON.parse(
    await readFile(path.join(repositoryRoot, "package.json"), "utf8"),
  );
  const nodeComponents = componentsByName(documents.get("node.cdx.json").document);
  for (const [name, version] of Object.entries({
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  })) {
    assert.ok(nodeComponents.has(`${name}@${version}`), `Node SBOM misses ${name}@${version}`);
  }

  const pythonProject = await readFile(path.join(repositoryRoot, "pyproject.toml"), "utf8");
  const pythonComponents = componentsByName(documents.get("python.cdx.json").document);
  for (const [, name, version] of pythonProject.matchAll(/"([a-z0-9-]+)==([^"\s]+)"/gi)) {
    assert.ok(
      pythonComponents.has(`${name}@${version}`),
      `Python SBOM misses ${name}@${version}`,
    );
  }

  const [appLock, verificationMetadata, versionCatalog, gameServerBuild] = await Promise.all([
    readFile(path.join(repositoryRoot, "apps", "game-server", "gradle.lockfile"), "utf8"),
    readFile(path.join(repositoryRoot, "gradle", "verification-metadata.xml"), "utf8"),
    readFile(path.join(repositoryRoot, "gradle", "libs.versions.toml"), "utf8"),
    readFile(path.join(repositoryRoot, "apps", "game-server", "build.gradle.kts"), "utf8"),
  ]);
  const jvmDocument = documents.get("jvm.cdx.json").document;
  assertJvmDirectDependencies(jvmDocument, versionCatalog, gameServerBuild, appLock);
  for (const component of jvmDocument.components) {
    const purl = component.purl ?? "";
    const match = purl.match(/^pkg:maven\/([^/]+)\/([^@?]+)@([^?]+)/);
    if (!match) continue;
    const coordinate = `${decodeURIComponent(match[1])}:${decodeURIComponent(match[2])}:${decodeURIComponent(match[3])}`;
    if (coordinate.startsWith("de.zugfolge:")) continue;
    assert.ok(
      appLock.includes(coordinate) || verificationMetadata.includes(coordinate.replaceAll(":", '"')),
      `JVM SBOM component is not traceable: ${coordinate}`,
    );
  }

  const manifest = JSON.parse(
    await readFile(path.join(sbomRoot, "manifest.json"), "utf8"),
  );
  assert.equal(manifest.schemaVersion, 1);
  assert.deepEqual(
    manifest.documents.map(({ name }) => name),
    EXPECTED_DOCUMENTS,
  );
  for (const entry of manifest.documents) {
    const bytes = documents.get(entry.name).bytes;
    assert.equal(entry.size, bytes.byteLength);
    assert.equal(entry.sha256, sha256(bytes));
  }
  return { components: Object.fromEntries(
    [...documents].map(([name, { document }]) => [name, document.components.length]),
  ) };
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const result = await verifySbomDocuments();
  console.log(`Verified CycloneDX evidence: ${JSON.stringify(result.components)}.`);
}
