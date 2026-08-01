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

function xmlAttributes(source, tagName, label) {
  const match = source.match(new RegExp(`<${tagName}\\b([^>]*)>`));
  assert.ok(match, `${label} needs a ${tagName} element`);
  const attributes = Object.fromEntries(
    [...match[1].matchAll(/([A-Za-z_:][\w:.-]*)=(?:"([^"]*)"|'([^']*)')/g)].map(
      ([, name, doubleQuoted, singleQuoted]) => [name, doubleQuoted ?? singleQuoted],
    ),
  );
  return attributes;
}

function integerAttribute(attributes, name, label) {
  assert.match(attributes[name] ?? "", /^\d+$/, `${label} needs integer ${name}`);
  return Number(attributes[name]);
}

function assertNoAbsolutePaths(source, label) {
  assert.doesNotMatch(source, /\bfile:\/{2,3}(?:[A-Za-z]:|\/)/i, `${label} contains a file URI`);
  assert.doesNotMatch(source, /\b[A-Za-z]:[\\/]/, `${label} contains a Windows absolute path`);
  assert.doesNotMatch(source, /(?:^|[\s"'=])\\\\[^\\\s"']+[\\/]/m, `${label} contains a UNC path`);
  for (const match of source.matchAll(/(?:"|')([^"'\r\n]+)(?:"|')/g)) {
    assert.ok(!match[1].startsWith("/"), `${label} contains an absolute path`);
  }
}

function assertSuccessfulNodeSuite(source) {
  xmlAttributes(source, "testsuites", "Node JUnit");
  const testCases = [...source.matchAll(/<testcase\b/g)].length;
  assert.ok(testCases > 0, "Node JUnit must contain tests");
  assert.doesNotMatch(source, /<(?:failure|error|skipped)\b/, "Node JUnit contains unsuccessful tests");
  return testCases;
}

function assertSuccessfulJvmSuite(source) {
  const suite = xmlAttributes(source, "testsuite", "JVM JUnit");
  const tests = integerAttribute(suite, "tests", "JVM JUnit");
  const failures = integerAttribute(suite, "failures", "JVM JUnit");
  const errors = integerAttribute(suite, "errors", "JVM JUnit");
  const skipped = integerAttribute(suite, "skipped", "JVM JUnit");
  assert.ok(tests > 0, "JVM JUnit must contain tests");
  assert.equal(failures, 0, "JVM JUnit contains failures");
  assert.equal(errors, 0, "JVM JUnit contains errors");
  assert.equal(skipped, 0, "JVM JUnit contains skipped tests");
  assert.equal([...source.matchAll(/<testcase\b/g)].length, tests, "JVM JUnit test count is inconsistent");
  return tests;
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
  const expectedNodeTotals = {
    functionsCovered: 0,
    functionsTotal: 0,
    rangesCovered: 0,
    rangesTotal: 0,
  };
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
      expectedNodeTotals[field] += file[field];
    }
    assert.ok(file.functionsCovered <= file.functionsTotal);
    assert.ok(file.rangesCovered <= file.rangesTotal);
  }
  assert.deepEqual(node.totals, expectedNodeTotals, "Node coverage totals are inconsistent");
  assert.ok(node.totals.functionsTotal > 0 && node.totals.rangesTotal > 0);
  assert.ok(python.meta?.version === "7.15.2");
  assert.ok(Number.isFinite(python.totals?.percent_covered));
  assert.ok(Number.isInteger(python.totals?.num_statements) && python.totals.num_statements > 0);
  assert.equal(
    python.totals.covered_lines + python.totals.missing_lines,
    python.totals.num_statements,
    "Python line totals are inconsistent",
  );
  assert.ok(python.files && Object.keys(python.files).length > 0);
  assertSuccessfulNodeSuite(nodeJunitXml);
  assert.equal(pythonTests.schemaVersion, 1);
  assert.equal(pythonTests.runner, "unittest");
  assert.ok(Number.isInteger(pythonTests.tests) && pythonTests.tests > 0);
  assert.ok(Array.isArray(pythonTests.suites) && pythonTests.suites.length > 0);
  assert.ok(pythonTests.suites.every((suite) => suite.status === "PASSED"));
  assert.equal(
    pythonTests.suites.reduce((sum, suite) => {
      assert.ok(Number.isInteger(suite.tests) && suite.tests > 0);
      return sum + suite.tests;
    }, 0),
    pythonTests.tests,
    "Python unittest count is inconsistent",
  );
  const pythonCoverage = xmlAttributes(pythonXml, "coverage", "Python XML coverage");
  assert.equal(pythonCoverage.version, "7.15.2");
  const pythonLinesValid = integerAttribute(pythonCoverage, "lines-valid", "Python XML coverage");
  const pythonLinesCovered = integerAttribute(pythonCoverage, "lines-covered", "Python XML coverage");
  assert.ok(pythonLinesValid > 0 && pythonLinesCovered <= pythonLinesValid);

  const jacocoReport = xmlAttributes(jacocoXml, "report", "JaCoCo XML coverage");
  assert.equal(jacocoReport.name, "game-server");
  const jacocoCounters = [...jacocoXml.matchAll(/<counter\b([^>]*)\/>/g)].map(([, attributes]) =>
    Object.fromEntries(
      [...attributes.matchAll(/([A-Za-z_:][\w:.-]*)="([^"]*)"/g)].map(([, name, value]) => [name, value]),
    ),
  );
  const instructionCounters = jacocoCounters.filter(({ type }) => type === "INSTRUCTION");
  assert.ok(instructionCounters.length > 0, "JaCoCo XML needs instruction counters");
  assert.ok(
    instructionCounters.some((counter) => {
      const missed = integerAttribute(counter, "missed", "JaCoCo instruction counter");
      const covered = integerAttribute(counter, "covered", "JaCoCo instruction counter");
      return missed + covered > 0 && covered > 0;
    }),
    "JaCoCo XML contains no covered instructions",
  );
  assertSuccessfulJvmSuite(junitXml);

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
  assertNoAbsolutePaths(combined, "local evidence");

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
