import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

async function requiredText(filePath, label) {
  return readFile(filePath, "utf8").catch((error) => {
    if (error?.code === "ENOENT") {
      throw new Error(`${label} evidence is missing at ${filePath}`);
    }
    throw error;
  });
}

export async function verifyLocalEvidence(repositoryPath) {
  const nodePath = path.join(
    repositoryPath,
    "outputs",
    "coverage",
    "node",
    "coverage-summary.json",
  );
  const pythonJsonPath = path.join(
    repositoryPath,
    "outputs",
    "coverage",
    "python",
    "coverage.json",
  );
  const pythonXmlPath = path.join(
    repositoryPath,
    "outputs",
    "coverage",
    "python",
    "coverage.xml",
  );
  const pythonTestPath = path.join(
    repositoryPath,
    "outputs",
    "coverage",
    "python",
    "test-results.json",
  );
  const nodeTestPath = path.join(
    repositoryPath,
    "outputs",
    "coverage",
    "node",
    "test-results.xml",
  );
  const jacocoPath = path.join(
    repositoryPath,
    ".gradle-build",
    "apps",
    "game-server",
    "reports",
    "jacoco",
    "test",
    "jacocoTestReport.xml",
  );
  const junitPath = path.join(
    repositoryPath,
    ".gradle-build",
    "apps",
    "game-server",
    "test-results",
    "test",
    "TEST-de.zugfolge.architecture.EngineeringBaselineTest.xml",
  );

  const [
    nodeSource,
    nodeJunitXml,
    pythonJsonSource,
    pythonTestSource,
    pythonXml,
    jacocoXml,
    junitXml,
  ] =
    await Promise.all([
      requiredText(nodePath, "Node coverage"),
      requiredText(nodeTestPath, "Node JUnit"),
      requiredText(pythonJsonPath, "Python JSON coverage"),
      requiredText(pythonTestPath, "Python unittest JSON"),
      requiredText(pythonXmlPath, "Python XML coverage"),
      requiredText(jacocoPath, "JaCoCo XML coverage"),
      requiredText(junitPath, "JUnit XML"),
    ]);
  const node = JSON.parse(nodeSource);
  const python = JSON.parse(pythonJsonSource);
  const pythonTests = JSON.parse(pythonTestSource);

  assert.equal(node.schemaVersion, 1);
  assert.match(node.engine, /^Node\.js 24\.18\.0 V8$/);
  assert.ok(Array.isArray(node.files) && node.files.length > 0);
  for (const file of node.files) {
    assert.ok(file.file && !path.isAbsolute(file.file));
    assert.doesNotMatch(file.file, /^\.\.\//);
    assert.doesNotMatch(file.file, /\\/);
    for (const field of [
      "functionsCovered",
      "functionsTotal",
      "rangesCovered",
      "rangesTotal",
    ]) {
      assert.ok(Number.isInteger(file[field]) && file[field] >= 0);
    }
  }
  assert.ok(python.meta?.version === "7.15.2");
  assert.ok(python.totals && Number.isFinite(python.totals.percent_covered));
  assert.match(nodeJunitXml, /<testsuites\b/);
  assert.equal(pythonTests.schemaVersion, 1);
  assert.equal(pythonTests.runner, "unittest");
  assert.ok(Number.isInteger(pythonTests.tests) && pythonTests.tests > 0);
  assert.ok(pythonTests.suites.every((suite) => suite.status === "PASSED"));
  assert.match(pythonXml, /<coverage\b/);
  assert.match(jacocoXml, /<report\s+name=/);
  assert.match(junitXml, /<testsuite\b/);

  const combined = [
    nodeSource,
    nodeJunitXml,
    pythonJsonSource,
    pythonTestSource,
    pythonXml,
    jacocoXml,
    junitXml,
  ]
    .join("\n")
    .replaceAll("\\", "/");
  const normalizedRoot = path.resolve(repositoryPath).replaceAll("\\", "/");
  assert.doesNotMatch(combined, new RegExp(normalizedRoot.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));

  return {
    nodeFiles: node.files.length,
    pythonPercentCovered: python.totals.percent_covered,
    reports: 7,
  };
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const repositoryPath = path.resolve(fileURLToPath(new URL("../", import.meta.url)));
  const evidence = await verifyLocalEvidence(repositoryPath);
  console.log(
    `Verified ${evidence.reports} local evidence files: ${evidence.nodeFiles} Node files, Python ${evidence.pythonPercentCovered.toFixed(2)}%.`,
  );
}
