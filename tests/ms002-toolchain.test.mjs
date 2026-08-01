import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import {
  verifyGradleWrapper,
  verifyJavaPropertyOutput,
} from "../tools/verify-gradle-wrapper.mjs";

const REPOSITORY_PATH = fileURLToPath(new URL("../", import.meta.url));

test("JavaScript toolchain and workspace are pinned exactly", async () => {
  const [packageJson, nodeVersion, workspace, lock] = await Promise.all([
    readFile(new URL("../package.json", import.meta.url), "utf8").then(JSON.parse),
    readFile(new URL("../.node-version", import.meta.url), "utf8"),
    readFile(new URL("../pnpm-workspace.yaml", import.meta.url), "utf8").then(
      parseYaml,
    ),
    readFile(new URL("../pnpm-lock.yaml", import.meta.url), "utf8").then(
      parseYaml,
    ),
  ]);

  assert.equal(nodeVersion.trim(), "24.18.0");
  assert.equal(packageJson.packageManager, "pnpm@11.18.0");
  assert.equal(packageJson.engines.node, "24.18.0");
  assert.equal(packageJson.engines.pnpm, "11.18.0");
  assert.deepEqual(workspace.packages, ["."]);
  assert.equal(lock.lockfileVersion, "9.0");
  assert.ok(lock.importers["."], "root pnpm importer is missing");
  await assert.rejects(
    readFile(new URL("../package-lock.json", import.meta.url)),
    { code: "ENOENT" },
  );
});

test("frozen pnpm install rejects a stale package manifest", async (context) => {
  const pnpmEntry = process.env.npm_execpath;
  assert.match(
    pnpmEntry ?? "",
    /pnpm(?:\.[cm]?js)?$/i,
    "run this test through the repository-pinned pnpm command",
  );

  const temporaryRoot = await mkdtemp(
    path.join(os.tmpdir(), "zugfolge-stale-pnpm-lock-"),
  );
  context.after(() => rm(temporaryRoot, { recursive: true, force: true }));

  const packageJson = JSON.parse(
    await readFile(new URL("../package.json", import.meta.url), "utf8"),
  );
  packageJson.dependencies.react = "19.2.7";
  await Promise.all([
    writeFile(
      path.join(temporaryRoot, "package.json"),
      `${JSON.stringify(packageJson, null, 2)}\n`,
    ),
    writeFile(
      path.join(temporaryRoot, "pnpm-lock.yaml"),
      await readFile(new URL("../pnpm-lock.yaml", import.meta.url)),
    ),
    writeFile(
      path.join(temporaryRoot, "pnpm-workspace.yaml"),
      'packages:\n  - "."\n',
    ),
  ]);

  const result = spawnSync(
    process.execPath,
    [pnpmEntry, "install", "--frozen-lockfile", "--ignore-scripts"],
    {
      cwd: temporaryRoot,
      encoding: "utf8",
      env: { ...process.env, CI: "true" },
    },
  );

  assert.notEqual(result.status, 0, "stale lock unexpectedly installed");
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /frozen-lockfile|outdated|lockfile/i,
  );
});

async function wrapperFixture(context) {
  const fixture = await mkdtemp(path.join(os.tmpdir(), "zugfolge-wrapper-"));
  context.after(() => rm(fixture, { recursive: true, force: true }));
  await mkdir(path.join(fixture, "gradle", "wrapper"), { recursive: true });
  await mkdir(path.join(fixture, "docs"), { recursive: true });
  await Promise.all([
    copyFile(
      path.join(REPOSITORY_PATH, "gradle", "wrapper", "gradle-wrapper.jar"),
      path.join(fixture, "gradle", "wrapper", "gradle-wrapper.jar"),
    ),
    copyFile(
      path.join(REPOSITORY_PATH, "gradle", "wrapper", "gradle-wrapper.properties"),
      path.join(fixture, "gradle", "wrapper", "gradle-wrapper.properties"),
    ),
    copyFile(
      path.join(REPOSITORY_PATH, "docs", "DEPENDENCIES.md"),
      path.join(fixture, "docs", "DEPENDENCIES.md"),
    ),
  ]);
  return fixture;
}

test("Gradle wrapper and distribution retain independently reviewed checksums", async () => {
  const evidence = await verifyGradleWrapper(REPOSITORY_PATH);
  assert.deepEqual(evidence, {
    distributionSha256:
      "553c78f50dafcd54d65b9a444649057857469edf836431389695608536d6b746",
    gradleVersion: "9.5.0",
    wrapperSha256:
      "497c8c2a7e5031f6aa847f88104aa80a93532ec32ee17bdb8d1d2f67a194a9c7",
  });
});

test("JVM policy rejects a different vendor or patch release", () => {
  const approved = `
    java.runtime.version = 21.0.12+8-LTS
    java.vendor = Eclipse Adoptium
  `;
  assert.deepEqual(verifyJavaPropertyOutput(approved), {
    runtimeVersion: "21.0.12+8-LTS",
    vendor: "Eclipse Adoptium",
  });
  assert.throws(
    () => verifyJavaPropertyOutput(approved.replace("Eclipse Adoptium", "Oracle Corporation")),
    /Eclipse Adoptium/,
  );
  assert.throws(
    () => verifyJavaPropertyOutput(approved.replace("21.0.12+8-LTS", "21.0.13+9-LTS")),
    /21\.0\.12\+8-LTS/,
  );
});

test("wrapper verification fails closed after JAR tampering", async (context) => {
  const fixture = await wrapperFixture(context);
  await writeFile(
    path.join(fixture, "gradle", "wrapper", "gradle-wrapper.jar"),
    "not an executable wrapper",
  );
  await assert.rejects(
    verifyGradleWrapper(fixture),
    /wrapper JAR checksum does not match/,
  );
});

test("wrapper verification fails closed after distribution drift", async (context) => {
  const fixture = await wrapperFixture(context);
  const propertiesPath = path.join(
    fixture,
    "gradle",
    "wrapper",
    "gradle-wrapper.properties",
  );
  const properties = await readFile(propertiesPath, "utf8");
  await writeFile(
    propertiesPath,
    properties.replace("gradle-9.5.0-bin.zip", "gradle-9.6.0-bin.zip"),
  );
  await assert.rejects(verifyGradleWrapper(fixture));
});

test("Kotlin foundation pins JVM 21 and writes outside tracked build source", async () => {
  const [rootBuild, applicationBuild, properties, versions, ignore, lock, verification] =
    await Promise.all([
      readFile(path.join(REPOSITORY_PATH, "build.gradle.kts"), "utf8"),
      readFile(
        path.join(REPOSITORY_PATH, "apps", "game-server", "build.gradle.kts"),
        "utf8",
      ),
      readFile(path.join(REPOSITORY_PATH, "gradle.properties"), "utf8"),
      readFile(path.join(REPOSITORY_PATH, "gradle", "libs.versions.toml"), "utf8"),
      readFile(path.join(REPOSITORY_PATH, ".gitignore"), "utf8"),
      readFile(
        path.join(REPOSITORY_PATH, "apps", "game-server", "gradle.lockfile"),
        "utf8",
      ),
      readFile(
        path.join(REPOSITORY_PATH, "gradle", "verification-metadata.xml"),
        "utf8",
      ),
    ]);
  assert.match(rootBuild, /\.gradle-build\/root/);
  assert.match(applicationBuild, /languageVersion\.set\(JavaLanguageVersion\.of\(21\)\)/);
  assert.match(applicationBuild, /vendor\.set\(JvmVendorSpec\.ADOPTIUM\)/);
  assert.match(applicationBuild, /21\.0\.12\+8-LTS/);
  assert.match(applicationBuild, /explicitApi\(\)/);
  assert.doesNotMatch(applicationBuild, /project\s*\(/);
  assert.doesNotMatch(applicationBuild, /spring|ktor|micronaut/i);
  assert.match(versions, /^kotlin = "2\.4\.10"$/m);
  assert.match(versions, /^junit = "6\.1\.2"$/m);
  assert.match(ignore, /^\/\.gradle-build\/$/m);
  assert.match(rootBuild, /approvedJavaVendor = "Eclipse Adoptium"/);
  assert.match(rootBuild, /approvedJavaRuntime = "21\.0\.12\+8-LTS"/);
  assert.match(properties, /^org\.gradle\.java\.installations\.auto-detect=false$/m);
  assert.match(properties, /^org\.gradle\.java\.installations\.auto-download=false$/m);
  assert.doesNotMatch(rootBuild, /layout\.buildDirectory.*["']build["']/);
  assert.match(lock, /^org\.jetbrains\.kotlin:kotlin-stdlib:2\.4\.10=/m);
  assert.match(lock, /^org\.junit\.jupiter:junit-jupiter:6\.1\.2=/m);
  assert.match(verification, /<verify-metadata>true<\/verify-metadata>/);
  assert.match(verification, /<sha256 value="[a-f0-9]{64}"/);
});
