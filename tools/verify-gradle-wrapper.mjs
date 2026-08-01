import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const EXPECTED_GRADLE_VERSION = "9.5.0";
const EXPECTED_DISTRIBUTION_SHA256 =
  "553c78f50dafcd54d65b9a444649057857469edf836431389695608536d6b746";
const EXPECTED_WRAPPER_SHA256 =
  "497c8c2a7e5031f6aa847f88104aa80a93532ec32ee17bdb8d1d2f67a194a9c7";
const EXPECTED_JAVA_RUNTIME = "21.0.12+8-LTS";
const EXPECTED_JAVA_VENDOR = "Eclipse Adoptium";
const execFileAsync = promisify(execFile);

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function property(source, key) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return source.match(new RegExp(`^\\s*${escaped}\\s*=\\s*(.+?)\\s*$`, "m"))?.[1];
}

export function verifyJavaPropertyOutput(source) {
  assert.equal(
    property(source.trimStart(), "java.vendor"),
    EXPECTED_JAVA_VENDOR,
    `JAVA_HOME must provide ${EXPECTED_JAVA_VENDOR}`,
  );
  assert.equal(
    property(source.trimStart(), "java.runtime.version"),
    EXPECTED_JAVA_RUNTIME,
    `JAVA_HOME must provide exact runtime ${EXPECTED_JAVA_RUNTIME}`,
  );
  return {
    runtimeVersion: EXPECTED_JAVA_RUNTIME,
    vendor: EXPECTED_JAVA_VENDOR,
  };
}

export async function verifyApprovedJavaRuntime(environment = process.env) {
  assert.ok(environment.JAVA_HOME, "JAVA_HOME must point to Eclipse Temurin 21.0.12+8");
  const executable = path.join(
    environment.JAVA_HOME,
    "bin",
    process.platform === "win32" ? "java.exe" : "java",
  );
  const { stdout, stderr } = await execFileAsync(
    executable,
    ["-XshowSettings:properties", "-version"],
    { encoding: "utf8", windowsHide: true },
  );
  return verifyJavaPropertyOutput(`${stdout}\n${stderr}`);
}

export async function verifyGradleWrapper(repositoryPath) {
  const wrapperPath = path.join(
    repositoryPath,
    "gradle",
    "wrapper",
    "gradle-wrapper.jar",
  );
  const propertiesPath = path.join(
    repositoryPath,
    "gradle",
    "wrapper",
    "gradle-wrapper.properties",
  );
  const documentationPath = path.join(repositoryPath, "docs", "DEPENDENCIES.md");
  const [wrapperBytes, properties, documentation] = await Promise.all([
    readFile(wrapperPath),
    readFile(propertiesPath, "utf8"),
    readFile(documentationPath, "utf8"),
  ]);

  assert.equal(
    sha256(wrapperBytes),
    EXPECTED_WRAPPER_SHA256,
    "Gradle wrapper JAR checksum does not match the reviewed upstream artifact",
  );
  assert.equal(
    property(properties, "distributionUrl"),
    `https\\://services.gradle.org/distributions/gradle-${EXPECTED_GRADLE_VERSION}-bin.zip`,
  );
  assert.equal(
    property(properties, "distributionSha256Sum"),
    EXPECTED_DISTRIBUTION_SHA256,
  );
  assert.equal(property(properties, "validateDistributionUrl"), "true");
  assert.match(documentation, new RegExp(EXPECTED_DISTRIBUTION_SHA256));
  assert.match(documentation, new RegExp(EXPECTED_WRAPPER_SHA256));

  return {
    distributionSha256: EXPECTED_DISTRIBUTION_SHA256,
    gradleVersion: EXPECTED_GRADLE_VERSION,
    wrapperSha256: EXPECTED_WRAPPER_SHA256,
  };
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const repositoryPath = path.resolve(fileURLToPath(new URL("../", import.meta.url)));
  const javaEvidence = await verifyApprovedJavaRuntime();
  const evidence = await verifyGradleWrapper(repositoryPath);
  console.log(
    `Verified ${javaEvidence.vendor} ${javaEvidence.runtimeVersion} and Gradle ${evidence.gradleVersion}: distribution ${evidence.distributionSha256}, wrapper ${evidence.wrapperSha256}`,
  );
}
