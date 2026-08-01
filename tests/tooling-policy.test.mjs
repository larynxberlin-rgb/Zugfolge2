import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  compileJsonSchemas,
  validateAsyncApi,
  validateKotlinSource,
  validateOpenApi,
  validateSpecificationIdentity,
  verifySpecificationTree,
} from "../tools/spec-lint.mjs";
import { verifyLocalEvidence } from "../tools/verify-local-evidence.mjs";

const REPOSITORY_PATH = fileURLToPath(new URL("../", import.meta.url));

test("accepted specification and contract tree passes deterministic lint", async () => {
  const result = await verifySpecificationTree(REPOSITORY_PATH);
  assert.deepEqual(result, {
    asyncApiDocuments: 1,
    jsonSchemas: 5,
    kotlinSources: 1,
    openApiDocuments: 1,
    specifications: 8,
  });
});

test("spec, schema, OpenAPI, AsyncAPI, and boundary errors fail their phase", () => {
  assert.throws(
    () =>
      validateSpecificationIdentity(
        "FEAT-9999-invalid.md",
        "# FEAT-9998: Wrong\n\n**Status:** Accepted\n**Version:** 1.0\n",
      ),
    /FEAT-9999/,
  );
  assert.throws(() => compileJsonSchemas([{ $id: "invalid", type: "not-a-type" }]));
  assert.throws(
    () => validateOpenApi({ openapi: "3.0.0", info: {}, paths: {} }),
    /OpenAPI must remain 3\.1\.0/,
  );
  assert.throws(
    () => validateAsyncApi({ asyncapi: "3.0.0", info: { title: "x", version: "1" } }),
    /channels are missing/,
  );
  assert.throws(
    () => validateKotlinSource("import integrations.odoo.PrivateBridge"),
    /crosses a private or framework boundary/,
  );
});

async function evidenceFixture(context) {
  const root = await mkdtemp(path.join(os.tmpdir(), "zugfolge-evidence-"));
  context.after(() => rm(root, { force: true, recursive: true }));
  const nodePath = path.join(root, "outputs", "coverage", "node");
  const pythonPath = path.join(root, "outputs", "coverage", "python");
  const jvmReportPath = path.join(
    root,
    ".gradle-build",
    "apps",
    "game-server",
    "reports",
    "jacoco",
    "test",
  );
  const jvmTestPath = path.join(
    root,
    ".gradle-build",
    "apps",
    "game-server",
    "test-results",
    "test",
  );
  await Promise.all(
    [nodePath, pythonPath, jvmReportPath, jvmTestPath].map((directory) =>
      mkdir(directory, { recursive: true }),
    ),
  );
  await Promise.all([
    writeFile(
      path.join(nodePath, "coverage-summary.json"),
      JSON.stringify({
        schemaVersion: 1,
        engine: "Node.js 24.18.0 V8",
        files: [
          {
            file: "tools/example.mjs",
            functionsCovered: 1,
            functionsTotal: 1,
            rangesCovered: 1,
            rangesTotal: 1,
          },
        ],
        totals: {},
      }),
    ),
    writeFile(path.join(nodePath, "test-results.xml"), "<testsuites/>"),
    writeFile(
      path.join(pythonPath, "coverage.json"),
      JSON.stringify({ meta: { version: "7.15.2" }, totals: { percent_covered: 100 } }),
    ),
    writeFile(
      path.join(pythonPath, "test-results.json"),
      JSON.stringify({
        schemaVersion: 1,
        runner: "unittest",
        suites: [{ suite: "data-pipeline", status: "PASSED", tests: 1 }],
        tests: 1,
      }),
    ),
    writeFile(path.join(pythonPath, "coverage.xml"), '<coverage version="7.15.2"/>'),
    writeFile(path.join(jvmReportPath, "jacocoTestReport.xml"), '<report name="game-server"/>'),
    writeFile(
      path.join(jvmTestPath, "TEST-de.zugfolge.architecture.EngineeringBaselineTest.xml"),
      '<testsuite name="EngineeringBaselineTest" tests="2" failures="0"/>',
    ),
  ]);
  return root;
}

test("local evidence verifier accepts complete relative machine reports", async (context) => {
  const root = await evidenceFixture(context);
  assert.deepEqual(await verifyLocalEvidence(root), {
    nodeFiles: 1,
    pythonPercentCovered: 100,
    reports: 7,
  });
});

test("local evidence verifier fails when a stack report is absent", async (context) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "zugfolge-missing-evidence-"));
  context.after(() => rm(root, { force: true, recursive: true }));
  await assert.rejects(verifyLocalEvidence(root), /evidence is missing/);
});
