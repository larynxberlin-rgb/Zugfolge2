import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { parse } from "yaml";
import {
  checkThirdPartyNotices,
  DISTRIBUTED_WEB_PACKAGES,
  LICENSE_TEXT_FALLBACKS,
  normalizedTextSha256,
} from "../scripts/generate-third-party-notices.mjs";

const REPOSITORY_ROOT = new URL("../", import.meta.url);
const REPOSITORY_PATH = fileURLToPath(REPOSITORY_ROOT);
const REQUIRED_MEDIA_EXTENSIONS = new Set([
  ".png", ".svg", ".jpg", ".jpeg", ".jpe", ".jfif", ".gif", ".webp",
  ".avif", ".ico", ".bmp", ".tif", ".tiff", ".apng", ".woff", ".woff2",
  ".ttf", ".otf", ".eot", ".mp3", ".wav", ".wave", ".ogg", ".oga",
  ".opus", ".flac", ".aac", ".m4a", ".mp4", ".m4v", ".webm", ".mov",
  ".mkv", ".avi",
]);
const [
  assets,
  dependencies,
  rightsRegister,
  packageJson,
  lockSource,
  buildConstraintSource,
] =
  await Promise.all([
    readFile(new URL("../compliance/assets.yaml", import.meta.url), "utf8").then(
      parse,
    ),
    readFile(
      new URL("../compliance/dependencies.yaml", import.meta.url),
      "utf8",
    ).then(parse),
    readFile(
      new URL("../compliance/rights-register.yaml", import.meta.url),
      "utf8",
    ).then(parse),
    readFile(new URL("../package.json", import.meta.url), "utf8").then(
      JSON.parse,
    ),
    readFile(new URL("../pnpm-lock.yaml", import.meta.url), "utf8"),
    readFile(new URL("../build-constraints.txt", import.meta.url), "utf8"),
  ]);
const lock = parse(lockSource);

function trackedFiles() {
  return execFileSync("git", ["ls-files", "-z"], {
    cwd: REPOSITORY_ROOT,
    encoding: "utf8",
  })
    .split("\0")
    .filter(Boolean)
    .map((path) => path.replaceAll("\\", "/"));
}

function uniqueBy(items, key, label) {
  assert.equal(
    new Set(items.map((item) => item[key])).size,
    items.length,
    `${label} ${key} values must be unique`,
  );
}

async function recursiveFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      return entry.isDirectory() ? recursiveFiles(entryPath) : [entryPath];
    }),
  );
  return files.flat();
}

function directoryEntryNames(entries) {
  return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
}

async function installedPnpmMetadata() {
  const virtualStore = path.join(REPOSITORY_PATH, "node_modules", ".pnpm");
  const virtualEntries = directoryEntryNames(
    await readdir(virtualStore, { withFileTypes: true }),
  );
  const packages = new Map();

  async function collect(packageDirectory) {
    const metadata = await readFile(
      path.join(packageDirectory, "package.json"),
      "utf8",
    )
      .then(JSON.parse)
      .catch((error) => {
        if (error?.code === "ENOENT") return null;
        throw error;
      });
    if (metadata?.name && metadata.version) {
      packages.set(`${metadata.name}@${metadata.version}`, metadata);
    }
  }

  for (const virtualEntry of virtualEntries) {
    const packageRoot = path.join(virtualStore, virtualEntry, "node_modules");
    const entries = await readdir(packageRoot, { withFileTypes: true }).catch(
      (error) => {
        if (error?.code === "ENOENT") return [];
        throw error;
      },
    );
    for (const entry of entries) {
      if (entry.name.startsWith("@") && entry.isDirectory()) {
        const scopeRoot = path.join(packageRoot, entry.name);
        for (const scopedEntry of await readdir(scopeRoot, {
          withFileTypes: true,
        })) {
          await collect(path.join(scopeRoot, scopedEntry.name));
        }
      } else {
        await collect(path.join(packageRoot, entry.name));
      }
    }
  }

  return [...packages.values()];
}

test("pnpm metadata files are never traversed as virtual package directories", () => {
  const entries = [
    { name: "lock.yaml", isDirectory: () => false },
    { name: "react@19.2.8", isDirectory: () => true },
  ];
  assert.deepEqual(directoryEntryNames(entries), ["react@19.2.8"]);
});

test("S04 asset inventory fails closed and matches registered bytes", async () => {
  assert.equal(assets.schemaVersion, 1);
  assert.equal(assets.status, "INVENTORIED_REVIEW_PENDING");
  assert.equal(assets.releasePolicy.publicDistributionEligible, false);
  assert.equal(assets.releasePolicy.evaluationBuildOnly, true);
  assert.deepEqual(assets.authority.requirements, [
    "RIGHTS-002",
    "RIGHTS-003",
    "RIGHTS-007",
  ]);
  uniqueBy(assets.assets, "id", "assets");
  uniqueBy(assets.assets, "path", "assets");

  const rightsAssets = new Map(
    rightsRegister.assets.map((asset) => [asset.id, asset]),
  );
  for (const asset of assets.assets) {
    const bytes = await readFile(new URL(`../${asset.path}`, import.meta.url));
    assert.equal(
      createHash("sha256").update(bytes).digest("hex").toUpperCase(),
      asset.sha256,
      `${asset.id} checksum drift requires a new provenance decision`,
    );
    assert.equal(asset.provenanceStatus, "ORIGIN_REVIEW_REQUIRED");
    assert.equal(asset.licenseDecision, "LicenseRef-Zugfolge-Provenance-Pending");
    assert.deepEqual(asset.permittedUses, []);
    assert.equal(asset.currentUse, "LOCAL_EVALUATION_BUILD_ONLY");
    assert.equal(asset.publicReleaseEligibility, "BLOCKED");
    assert.deepEqual(asset.evidenceRefs, []);

    const registered = rightsAssets.get(asset.id);
    assert.ok(registered, `${asset.id} is absent from rights-register.yaml`);
    assert.equal(registered.path, asset.path);
    assert.equal(registered.sha256, asset.sha256);
    assert.equal(registered.provenanceStatus, asset.provenanceStatus);
    assert.match(registered.licenseDecision, /Provenance-Pending/);
  }
});

test("all tracked media, fonts, audio, and containers are inventoried", async () => {
  const files = trackedFiles();
  const extensions = new Set(assets.discovery.trackedMediaExtensions);
  for (const extension of REQUIRED_MEDIA_EXTENSIONS) {
    assert.ok(extensions.has(extension), `${extension} must remain discoverable`);
  }
  const trackedMedia = files.filter((path) =>
    extensions.has(`.${path.split(".").at(-1)?.toLowerCase()}`),
  );
  const inventoriedMedia = assets.assets
    .map(({ path }) => path)
    .filter((path) =>
      extensions.has(`.${path.split(".").at(-1)?.toLowerCase()}`),
  );
  assert.deepEqual(trackedMedia.sort(), inventoriedMedia.sort());

  const publicExclusions = new Set(assets.discovery.publicAssetExclusions);
  const distributedPublicAssets = files.filter(
    (path) => path.startsWith("public/") && !publicExclusions.has(path),
  );
  assert.deepEqual(
    distributedPublicAssets.sort(),
    assets.assets
      .map(({ path }) => path)
      .filter((path) => path.startsWith("public/"))
      .sort(),
  );

  const trackedFonts = trackedMedia.filter((path) =>
    /\.(?:woff2?|ttf|otf|eot)$/i.test(path),
  );
  const trackedAudio = trackedMedia.filter((path) =>
    /\.(?:mp3|wav|wave|ogg|oga|opus|flac|aac|m4a)$/i.test(path),
  );
  const containers = files.filter((path) => /(?:^|\/)Dockerfile$/i.test(path));
  assert.deepEqual(trackedFonts, assets.discovery.trackedFontFiles);
  assert.deepEqual(trackedAudio, assets.discovery.trackedAudioFiles);
  assert.deepEqual(containers, assets.discovery.containerFiles);
  assert.deepEqual(assets.discovery.remoteFontProviders, []);

  const uiExtensions = new Set(assets.discovery.trackedUiSourceExtensions);
  const uiSources = files.filter(
    (file) =>
      /^(?:app|public)\//.test(file) &&
      uiExtensions.has(`.${file.split(".").at(-1)?.toLowerCase()}`),
  );
  const remoteFontPattern =
    /@font-face|@import\s+(?:url\(\s*)?["']?\s*https?:\/\/|url\(\s*["']?\s*https?:\/\/|<link\b[^>]*\bhref\s*=\s*["']https?:\/\/|https?:\/\/[^\s"'`)<>]*(?:font|typekit)[^\s"'`)<>]*|https?:\/\/[^\s"'`)<>]+\.(?:css|woff2?|ttf|otf|eot)(?:\?[^\s"'`)<>]*)?/i;
  for (const prohibitedReference of [
    '<link rel="stylesheet" href="https://rsms.me/inter/inter.css">',
    '@import url("https://cdn.example.invalid/type.css");',
    'src: url(https://cdn.example.invalid/asset);',
  ]) {
    assert.match(prohibitedReference, remoteFontPattern);
  }
  for (const file of uiSources) {
    const source = await readFile(new URL(`../${file}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, remoteFontPattern, `${file} references an external font`);
  }
});

test("locked pnpm graph and every installed license expression are controlled", async () => {
  const graph = dependencies.resolvedGraphs.find(
    ({ ecosystem }) => ecosystem === "npm",
  );
  assert.ok(graph);
  assert.equal(graph.exactResolution, true);
  assert.equal(graph.status, "LOCKED_REVIEW_PENDING");
  assert.equal(normalizedTextSha256(lockSource), graph.canonicalSha256);

  const entries = Object.entries(lock.packages);
  assert.equal(entries.length, graph.packageCountExcludingRoot);
  assert.deepEqual(
    entries.filter(([, metadata]) => !metadata.resolution?.integrity),
    [],
    "every registry package must retain pnpm integrity metadata",
  );

  const installed = await installedPnpmMetadata();
  const missing = installed.filter((metadata) => !metadata.license);
  assert.equal(missing.length, graph.missingLicenseMetadata);
  assert.deepEqual(missing, []);

  uniqueBy(dependencies.licenseExpressionPolicies, "expression", "policies");
  const observedExpressions = [
    ...new Set(installed.map((metadata) => metadata.license)),
  ].sort();
  const controlledExpressions = new Set(
    dependencies.licenseExpressionPolicies.map(({ expression }) => expression),
  );
  assert.deepEqual(
    observedExpressions.filter((expression) => !controlledExpressions.has(expression)),
    [],
    "installed license expressions must have an explicit policy",
  );
  for (const policy of dependencies.licenseExpressionPolicies) {
    assert.equal(policy.compatibility, "HUMAN_REVIEW_REQUIRED");
    for (const field of ["notice", "sourceOffer", "patent"]) {
      assert.ok(policy[field], `${policy.expression} needs ${field}`);
    }
  }
  assert.equal(dependencies.releasePolicy.publicDistributionEligible, false);
  assert.equal(
    dependencies.releasePolicy.compatibilityDecision,
    "HUMAN_REVIEW_REQUIRED",
  );
});

test("every direct npm package has an exact purpose and matching pnpm metadata", async () => {
  uniqueBy(dependencies.directPackages, "name", "direct packages");
  const rootScopes = new Map([
    ...Object.entries(packageJson.dependencies ?? {}).map(([name, version]) => [
      name,
      { scope: "RUNTIME", version },
    ]),
    ...Object.entries(packageJson.devDependencies ?? {}).map(([name, version]) => [
      name,
      { scope: "DEVELOPMENT", version },
    ]),
  ]);
  assert.deepEqual(
    dependencies.directPackages.map(({ name }) => name).sort(),
    [...rootScopes.keys()].sort(),
  );

  for (const dependency of dependencies.directPackages) {
    const root = rootScopes.get(dependency.name);
    const importerScope =
      dependency.scope === "RUNTIME" ? "dependencies" : "devDependencies";
    const reference = lock.importers["."][importerScope][dependency.name];
    const resolvedVersion = reference.version.replace(/\(.*/, "");
    const resolved = lock.packages[`${dependency.name}@${resolvedVersion}`];
    const metadata = await readFile(
      new URL(`../node_modules/${dependency.name}/package.json`, import.meta.url),
      "utf8",
    ).then(JSON.parse);
    assert.ok(root);
    assert.ok(resolved, `${dependency.name} is absent from pnpm-lock.yaml`);
    assert.equal(dependency.scope, root.scope);
    assert.equal(String(dependency.version), root.version);
    assert.equal(String(dependency.version), reference.specifier);
    assert.equal(String(dependency.version), resolvedVersion);
    assert.equal(metadata.version, resolvedVersion);
    assert.equal(dependency.licenseExpression, metadata.license);
    assert.ok(dependency.purpose, `${dependency.name} needs a purpose`);
  }
});

test("distributed packages and Python build dependencies stay explicit", async () => {
  assert.deepEqual(
    dependencies.distributedWebPackages.packages,
    [...DISTRIBUTED_WEB_PACKAGES],
  );
  assert.deepEqual(
    dependencies.distributedWebPackages.licenseTextFallbacks,
    LICENSE_TEXT_FALLBACKS,
  );
  assert.equal(
    dependencies.distributedWebPackages.status,
    "NOTICE_GENERATED_COMPATIBILITY_REVIEW_PENDING",
  );
  await checkThirdPartyNotices();

  const buildFiles = (await recursiveFiles(path.join(REPOSITORY_PATH, "dist"))).filter(
    (file) => /\.(?:js|mjs|cjs|css|html)$/i.test(file),
  );
  const markedPackages = new Set();
  for (const file of buildFiles) {
    const source = await readFile(file, "utf8");
    for (const match of source.matchAll(
      /node_modules\/((?:@[^/]+\/)?[^/]+)\//g,
    )) {
      if (match[1] !== ".pnpm") markedPackages.add(match[1]);
    }
  }
  const inventoriedPackages = new Set(
    dependencies.distributedWebPackages.packages,
  );
  for (const packageName of markedPackages) {
    assert.ok(
      inventoriedPackages.has(packageName),
      `${packageName} is present in build output but absent from distributedWebPackages`,
    );
  }

  const python = dependencies.resolvedGraphs.find(
    ({ ecosystem }) => ecosystem === "python",
  );
  assert.ok(python);
  assert.equal(python.exactResolution, true);
  assert.equal(python.lockfile, "uv.lock");
  assert.equal(python.buildConstraintFile, "build-constraints.txt");
  assert.equal(python.status, "LOCKED_REVIEW_PENDING");
  assert.deepEqual(python.runtimeDependencies, []);
  assert.deepEqual(python.developmentDependencies, ["coverage==7.15.2"]);
  assert.deepEqual(python.buildDependencies, [
    "editables==0.6",
    "hatchling==1.27.0",
  ]);
  const uvLock = await readFile(new URL("../uv.lock", import.meta.url), "utf8");
  assert.equal(normalizedTextSha256(uvLock), python.canonicalSha256);
  assert.equal(
    [...uvLock.matchAll(/^\[\[package\]\]$/gm)].length,
    python.packageCountIncludingWorkspace,
  );
  assert.match(uvLock, /^requires-python = "==3\.13\.14"$/m);
  assert.match(uvLock, /^name = "hatchling"$/m);
  assert.match(uvLock, /^version = "1\.27\.0"$/m);
  assert.match(uvLock, /^name = "editables"$/m);
  assert.match(uvLock, /^version = "0\.6"$/m);

  uniqueBy(dependencies.pythonBuildPackages, "name", "Python build packages");
  assert.deepEqual(
    dependencies.pythonBuildPackages.map(({ name }) => name).sort(),
    ["editables", "hatchling"],
  );
  for (const dependency of dependencies.pythonBuildPackages) {
    assert.equal(dependency.scope, "BUILD");
    assert.equal(dependency.owningSlice, "MS-002-S03");
    assert.equal(dependency.licenseExpression, "MIT");
    assert.match(dependency.officialSource, /^https:\/\/pypi\.org\/project\//);
    for (const field of [
      "purpose",
      "trustBoundary",
      "updateMethod",
      "rollback",
    ]) {
      assert.ok(dependency[field], `${dependency.name} needs ${field}`);
    }
  }

  const constrainedLines = buildConstraintSource
    .replace(/\\\r?\n\s*/g, " ")
    .trim()
    .split(/\r?\n/);
  const constrainedPackages = new Map(
    constrainedLines.map((line) => {
      const [requirement, ...hashArguments] = line.trim().split(/\s+/);
      const [name, version] = requirement.split("==");
      assert.ok(name && version, `${requirement} is not an exact constraint`);
      const hashes = hashArguments.map((argument) => {
        assert.match(argument, /^--hash=sha256:[a-f0-9]{64}$/);
        return argument.slice("--hash=".length);
      });
      assert.ok(hashes.length > 0, `${requirement} needs at least one hash`);
      return [name, { version, hashes: hashes.sort() }];
    }),
  );
  assert.equal(constrainedPackages.size, constrainedLines.length);

  const registryPackages = new Map(
    uvLock
      .split("[[package]]")
      .slice(1)
      .filter((block) => /^source = \{ registry = /m.test(block))
      .map((block) => {
        const name = block.match(/^name = "([^"]+)"$/m)?.[1];
        const version = block.match(/^version = "([^"]+)"$/m)?.[1];
        const hashes = [...block.matchAll(/hash = "(sha256:[a-f0-9]{64})"/g)]
          .map((match) => match[1])
          .sort();
        assert.ok(name && version && hashes.length > 0);
        return [name, { version, hashes }];
      }),
  );
  for (const [name, constraint] of constrainedPackages) {
    assert.deepEqual(constraint, registryPackages.get(name));
  }
  assert.deepEqual(
    [...registryPackages.keys()]
      .filter((name) => !constrainedPackages.has(name))
      .sort(),
    ["coverage"],
    "only the approved S05 test tool may sit outside the hashed PEP 517 closure",
  );
  const pythonVersion = await readFile(
    new URL("../.python-version", import.meta.url),
    "utf8",
  );
  assert.equal(pythonVersion.trim(), "3.13.14");
  const rootPythonProject = await readFile(
    new URL("../pyproject.toml", import.meta.url),
    "utf8",
  );
  assert.match(rootPythonProject, /^requires-python = "==3\.13\.14"$/m);
  assert.match(rootPythonProject, /^dev = \["coverage==7\.15\.2", /m);
  assert.doesNotMatch(rootPythonProject, /^no-build-isolation\s*=/m);
  for (const constraint of constrainedPackages.keys()) {
    assert.match(
      rootPythonProject,
      new RegExp(`^  "${constraint.replaceAll("-", "\\-")}==` , "m"),
    );
  }
  assert.match(rootPythonProject, /^required-version = "==0\.12\.0"$/m);
  assert.match(rootPythonProject, /^python-preference = "only-system"$/m);
  for (const path of python.manifests) {
    const project = await readFile(new URL(`../${path}`, import.meta.url), "utf8");
    assert.match(project, /^dependencies = \[\]$/m);
    if (path !== "pyproject.toml") {
      assert.match(project, /^requires = \["hatchling==1\.27\.0"\]$/m);
    }
  }

  uniqueBy(dependencies.coverageTools, "name", "coverage tools");
  assert.deepEqual(
    dependencies.coverageTools.map(({ name }) => name),
    ["node-v8-coverage", "coverage.py", "JaCoCo"],
  );
  for (const dependency of dependencies.coverageTools) {
    assert.equal(dependency.scope, "TEST");
    assert.equal(dependency.owningSlice, "MS-002-S05");
    assert.match(dependency.officialSource, /^https:\/\//);
    for (const field of [
      "purpose",
      "licenseExpression",
      "trustBoundary",
      "updateMethod",
      "rollback",
    ]) {
      assert.ok(dependency[field], `${dependency.name} needs ${field}`);
    }
  }

  const coverageRecord = dependencies.coverageTools.find(
    ({ name }) => name === "coverage.py",
  );
  assert.equal(registryPackages.get("coverage").version, coverageRecord.version);

  const [gameBuild, gameLock, gradleVerification] = await Promise.all([
    readFile(new URL("../apps/game-server/build.gradle.kts", import.meta.url), "utf8"),
    readFile(new URL("../apps/game-server/gradle.lockfile", import.meta.url), "utf8"),
    readFile(new URL("../gradle/verification-metadata.xml", import.meta.url), "utf8"),
  ]);
  assert.match(gameBuild, /toolVersion = "0\.8\.15"/);
  assert.match(gameLock, /^org\.jacoco:org\.jacoco\.agent:0\.8\.15=/m);
  assert.match(gameLock, /^org\.jacoco:org\.jacoco\.report:0\.8\.15=/m);
  assert.match(
    gradleVerification,
    /<component group="org\.jacoco" name="org\.jacoco\.agent" version="0\.8\.15">[\s\S]*?<sha256 value="[0-9a-f]{64}"/,
  );

  uniqueBy(dependencies.contractValidators, "name", "contract validators");
  assert.deepEqual(
    dependencies.contractValidators.map(({ name }) => name).sort(),
    ["@asyncapi/specs", "@redocly/cli"],
  );
  for (const validator of dependencies.contractValidators) {
    const direct = dependencies.directPackages.find(({ name }) => name === validator.name);
    assert.ok(direct, `${validator.name} needs a direct package record`);
    assert.equal(validator.scope, "DEVELOPMENT");
    assert.equal(validator.owningSlice, "MS-002-S05");
    assert.equal(String(validator.version), String(direct.version));
    assert.equal(validator.licenseExpression, direct.licenseExpression);
    assert.match(validator.officialSource, /^https:\/\//);
    for (const field of ["purpose", "trustBoundary", "updateMethod", "rollback"]) {
      assert.ok(validator[field], `${validator.name} needs ${field}`);
    }
  }

  uniqueBy(dependencies.sourceValidators, "name", "source validators");
  assert.deepEqual(
    dependencies.sourceValidators.map(({ name }) => name),
    ["typescript"],
  );
  for (const validator of dependencies.sourceValidators) {
    const direct = dependencies.directPackages.find(({ name }) => name === validator.name);
    assert.ok(direct, `${validator.name} needs a direct package record`);
    assert.equal(validator.scope, "DEVELOPMENT");
    assert.equal(validator.owningSlice, "MS-002-S05");
    assert.equal(String(validator.version), String(direct.version));
    assert.equal(validator.licenseExpression, direct.licenseExpression);
    assert.match(validator.officialSource, /^https:\/\//);
    assert.match(direct.purpose, /syntax-tree parsing/i);
    for (const field of ["purpose", "trustBoundary", "updateMethod", "rollback"]) {
      assert.ok(validator[field], `${validator.name} needs ${field}`);
    }
  }
});

test("workflow actions use inventoried immutable SHAs", async () => {
  const workflowPaths = trackedFiles().filter((path) =>
    /^\.github\/workflows\/.*\.ya?ml$/i.test(path),
  );
  const actual = new Map();
  for (const path of workflowPaths) {
    const workflow = await readFile(new URL(`../${path}`, import.meta.url), "utf8");
    for (const match of workflow.matchAll(/^\s*uses:\s*([^@\s]+)@([^\s#]+)/gm)) {
      const [, actionPath, reference] = match;
      const repository = actionPath.split("/").slice(0, 2).join("/");
      assert.match(reference, /^[0-9a-f]{40}$/, `${repository} is not full-SHA pinned`);
      const previous = actual.get(repository);
      assert.ok(!previous || previous === reference, `${repository} uses multiple SHAs`);
      actual.set(repository, reference);
    }
  }

  uniqueBy(dependencies.githubActions, "repository", "GitHub Actions");
  assert.deepEqual(
    [...actual.entries()].sort(),
    dependencies.githubActions
      .map(({ repository, sha }) => [repository, sha])
      .sort(),
  );
  for (const action of dependencies.githubActions) {
    assert.equal(action.licenseExpression, "MIT");
    assert.equal(action.status, "PINNED_CURRENT_USE_REVIEW_PENDING");
    assert.ok(action.purpose);
  }
  for (const repository of ["actions/setup-python", "astral-sh/setup-uv"]) {
    assert.equal(
      dependencies.githubActions.find((action) => action.repository === repository)
        ?.owningSlice,
      "MS-002-S03",
    );
  }
  assert.deepEqual(dependencies.containers, []);
  assert.deepEqual(dependencies.fonts, []);
});
