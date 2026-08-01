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
const [assets, dependencies, rightsRegister, packageJson, lockSource] =
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
    readFile(new URL("../package-lock.json", import.meta.url), "utf8"),
  ]);
const lock = JSON.parse(lockSource);

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

test("locked npm graph and every observed license expression are controlled", () => {
  const graph = dependencies.resolvedGraphs.find(
    ({ ecosystem }) => ecosystem === "npm",
  );
  assert.ok(graph);
  assert.equal(graph.exactResolution, true);
  assert.equal(graph.status, "LOCKED_REVIEW_PENDING");
  assert.equal(normalizedTextSha256(lockSource), graph.canonicalSha256);

  const entries = Object.entries(lock.packages).filter(([path]) => path !== "");
  assert.equal(entries.length, graph.packageCountExcludingRoot);
  const missing = entries.filter(([, metadata]) => !metadata.license);
  assert.equal(missing.length, graph.missingLicenseMetadata);
  assert.deepEqual(missing, []);

  uniqueBy(dependencies.licenseExpressionPolicies, "expression", "policies");
  const observedExpressions = [
    ...new Set(entries.map(([, metadata]) => metadata.license)),
  ].sort();
  const controlledExpressions = dependencies.licenseExpressionPolicies
    .map(({ expression }) => expression)
    .sort();
  assert.deepEqual(observedExpressions, controlledExpressions);
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

test("every direct npm package has an exact purpose and matching lock metadata", () => {
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
    const resolved = lock.packages[`node_modules/${dependency.name}`];
    assert.ok(root);
    assert.ok(resolved, `${dependency.name} is absent from package-lock.json`);
    assert.equal(dependency.scope, root.scope);
    assert.equal(String(dependency.version), root.version);
    assert.equal(String(dependency.version), resolved.version);
    assert.equal(dependency.licenseExpression, resolved.license);
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
  assert.equal(python.exactResolution, false);
  assert.equal(python.lockfile, null);
  assert.equal(python.status, "RELEASE_BLOCKED_NO_LOCK");
  assert.deepEqual(python.runtimeDependencies, []);
  assert.deepEqual(python.buildDependencies, ["hatchling==1.27.0"]);
  for (const path of python.manifests) {
    const project = await readFile(new URL(`../${path}`, import.meta.url), "utf8");
    assert.match(project, /^dependencies = \[\]$/m);
    assert.match(project, /^requires = \["hatchling==1\.27\.0"\]$/m);
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
  assert.deepEqual(dependencies.containers, []);
  assert.deepEqual(dependencies.fonts, []);
});
