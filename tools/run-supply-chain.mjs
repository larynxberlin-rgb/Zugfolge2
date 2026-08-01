// SPDX-FileCopyrightText: 2026 Zugfolge contributors
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const REPOSITORY_ROOT = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const OUTPUT_ROOT = path.join(REPOSITORY_ROOT, "outputs");
const SBOM_ROOT = path.join(OUTPUT_ROOT, "sbom");

function executable(name) {
  if (process.platform !== "win32") return name;
  if (name === "gradlew") return "gradlew.bat";
  if (name === "pnpm") return "pnpm.cmd";
  return name;
}

function run(name, args) {
  const batchCommand = process.platform === "win32" && (name === "gradlew" || name === "pnpm");
  const safeTokens = [executable(name), ...args];
  if (batchCommand && safeTokens.some((token) => !/^[A-Za-z0-9_./:=+@-]+$/.test(token))) {
    throw new Error(`Unsafe batch token while invoking ${name}.`);
  }
  const command = batchCommand ? process.env.ComSpec : executable(name);
  const commandArgs = batchCommand ? ["/d", "/s", "/c", safeTokens.join(" ")] : args;
  const result = spawnSync(command, commandArgs, {
    cwd: REPOSITORY_ROOT,
    encoding: "utf8",
    env: process.env,
    shell: false,
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  assert.ifError(result.error);
  assert.equal(result.status, 0, `${name} ${args.join(" ")} failed`);
}

function sha256(filePath) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

assert.ok(SBOM_ROOT.startsWith(`${REPOSITORY_ROOT}${path.sep}`));
rmSync(SBOM_ROOT, { force: true, recursive: true });
mkdirSync(SBOM_ROOT, { recursive: true });

run("pnpm", ["run", "coverage:node"]);
run("uv", ["run", "python", "tools/run-python-coverage.py"]);
run("gradlew", ["--no-daemon", "--console=plain", "test", "jacocoTestReport"]);

run("pnpm", [
  "sbom",
  "--sbom-format",
  "cyclonedx",
  "--sbom-spec-version",
  "1.6",
  "--lockfile-only",
  "--out",
  "outputs/sbom/node.cdx.json",
]);
run("uv", [
  "export",
  "--format",
  "requirements.txt",
  "--all-packages",
  "--locked",
  "--no-editable",
  "--no-emit-workspace",
  "--output-file",
  "outputs/sbom/python-requirements.txt",
]);
run("uv", [
  "run",
  "cyclonedx-py",
  "requirements",
  "outputs/sbom/python-requirements.txt",
  "--pyproject",
  "pyproject.toml",
  "--spec-version",
  "1.6",
  "--output-reproducible",
  "--output-format",
  "JSON",
  "--output-file",
  "outputs/sbom/python.cdx.json",
]);
linkPythonRootDependencies();
run("gradlew", ["--no-daemon", "--console=plain", "cyclonedxBom"]);
run("node", ["tools/verify-local-evidence.mjs"]);

const documents = ["jvm.cdx.json", "node.cdx.json", "python.cdx.json"];
const manifest = {
  schemaVersion: 1,
  documents: documents.map((name) => {
    const filePath = path.join(SBOM_ROOT, name);
    return { name, sha256: sha256(filePath), size: readFileSync(filePath).byteLength };
  }),
};
writeFileSync(
  path.join(SBOM_ROOT, "manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
  "utf8",
);
console.log(`Generated ${documents.length} CycloneDX documents and coverage evidence.`);

function linkPythonRootDependencies() {
  const sbomPath = path.join(SBOM_ROOT, "python.cdx.json");
  const sbom = JSON.parse(readFileSync(sbomPath, "utf8"));
  const directPackages = ["coverage", "cyclonedx-bom", "editables", "hatchling"];
  const directReferences = directPackages.map((packageName) => {
    const component = sbom.components?.find((candidate) => candidate.name === packageName);
    if (!component?.["bom-ref"]) {
      throw new Error(`Python SBOM is missing direct package ${packageName}.`);
    }
    return component["bom-ref"];
  });
  const rootReference = sbom.metadata?.component?.["bom-ref"];
  if (!rootReference) {
    throw new Error("Python SBOM has no root component reference.");
  }
  sbom.dependencies = (sbom.dependencies ?? []).filter(
    (dependency) => dependency.ref !== rootReference,
  );
  sbom.dependencies.unshift({ ref: rootReference, dependsOn: directReferences.sort() });
  writeFileSync(sbomPath, `${JSON.stringify(sbom, null, 2)}\n`, "utf8");
}
