import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  compileJsonSchemas,
  validateContractDocuments,
  validateAsyncApi,
  validateJavaScriptModuleSource,
  validateKotlinSource,
  validateOpenApi,
  validatePythonModuleSource,
  validateSpecificationIdentity,
  verifySpecificationTree,
} from "../tools/spec-lint.mjs";
import { verifyLocalEvidence } from "../tools/verify-local-evidence.mjs";

const REPOSITORY_PATH = fileURLToPath(new URL("../", import.meta.url));

test("accepted specification and contract tree passes deterministic lint", async () => {
  const result = await verifySpecificationTree(REPOSITORY_PATH);
  assert.deepEqual(result, {
    asyncApiDocuments: 1,
    javaScriptSources: 15,
    jsonSchemas: 5,
    kotlinSources: 1,
    openApiDocuments: 1,
    pythonPackages: 2,
    pythonSources: 4,
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
    () =>
      compileJsonSchemas([
        {
          $id: "https://zugfolge.example/invalid-ref.schema.json",
          $schema: "https://json-schema.org/draft/2020-12/schema",
          $ref: "https://zugfolge.example/missing.schema.json",
        },
      ]),
    /can't resolve reference|could not be compiled/,
  );
  assert.throws(
    () => validateOpenApi({ openapi: "3.0.0", info: {}, paths: {} }),
    /OpenAPI must remain 3\.1\.0/,
  );
  assert.throws(
    () =>
      validateOpenApi({
        openapi: "3.1.0",
        jsonSchemaDialect: "https://json-schema.org/draft/2020-12/schema",
        info: { title: "x", version: "1" },
        paths: { "/invalid": { get: { operationId: "invalid", responses: [] } } },
        components: { schemas: {} },
      }),
    /pinned spec validator/,
  );
  assert.throws(
    () =>
      validateOpenApi({
        openapi: "3.1.0",
        jsonSchemaDialect: "https://json-schema.org/draft/2020-12/schema",
        info: { title: 1, version: 2 },
        paths: {
          "/invalid": {
            get: {
              operationId: "invalid",
              parameters: [42],
              responses: { 200: { description: "ok" } },
            },
          },
        },
        forbiddenTopLevelField: true,
      }),
    /pinned spec validator/,
  );
  assert.throws(
    () => validateAsyncApi({ asyncapi: "3.0.0", info: { title: "x", version: "1" } }),
    /channels/,
  );
  assert.throws(
    () =>
      validateAsyncApi({
        asyncapi: "3.0.0",
        info: { title: "x", version: "1" },
        channels: { invalid: "not-a-channel" },
        operations: { invalid: "not-an-operation" },
        components: { schemas: { Invalid: { type: "not-a-type" } } },
      }),
    /official schema/,
  );
  assert.throws(
    () =>
      validateAsyncApi({
        asyncapi: "3.0.0",
        info: { title: "x", version: "1" },
        channels: {
          events: {
            address: "/events",
            messages: { invalid: { $ref: "#/components/messages/Invalid" } },
          },
        },
        operations: {
          receive: {
            action: "receive",
            channel: { $ref: "#/channels/events" },
            messages: [{ $ref: "#/channels/events/messages/invalid" }],
          },
        },
        components: {
          messages: {
            Invalid: { payload: { $ref: "#/components/schemas/Invalid" } },
          },
          schemas: { Invalid: { type: "not-a-type" } },
        },
      }),
    /official schema/,
  );
  assert.throws(
    () => validateKotlinSource("import integrations.odoo.PrivateBridge"),
    /crosses a private or framework boundary/,
  );
});

test("module-boundary lint rejects generated, private, and undeclared workspace edges", () => {
  assert.throws(
    () =>
      validateJavaScriptModuleSource(
        'import report from "../../.gradle-build/private.js";',
        "app/private.ts",
      ),
    /forbidden generated\/private path/,
  );
  assert.throws(
    () =>
      validateJavaScriptModuleSource(
        'import privateData from "../../apps/data-pipeline/src/private.js";',
        "app/private.ts",
      ),
    /private source tree/,
  );
  for (const privateSpecifier of [
    "apps/data-pipeline/src/private.js",
    "packages/domain/src/private.js",
    "node_modules/private/index.js",
  ]) {
    assert.throws(
      () =>
        validateJavaScriptModuleSource(
          `import privateModule from "${privateSpecifier}";`,
          "app/private.ts",
        ),
      /forbidden generated\/private path|private source tree|declared package export/,
    );
  }
  assert.throws(
    () =>
      validateJavaScriptModuleSource(
        'const privateModule = import("apps/" + moduleName);',
        "app/private.ts",
      ),
    /dynamic import/,
  );
  for (const runtimeLoaderSource of [
    "import /* boundary */ (target)",
    "require /* boundary */ (target)",
    "const loader = require; loader(target)",
    "const loader = Function; loader(source)",
    'import module from "node:module"; const loader = module["createRequire"](import.meta.url); loader(target)',
    'globalThis["Fun" + "ction"](source)',
    'globalThis[`eval`](source)',
    'module["createRequire" as string](import.meta.url)(target)',
    'globalThis["eval" satisfies string](source)',
    'const { ["createRequire"]: loader } = module; loader(import.meta.url)(target)',
    'Reflect.get(module, "createRequire")(import.meta.url)(target)',
    'import module from "node:module"; module.loader(target)',
  ]) {
    assert.throws(
      () => validateJavaScriptModuleSource(runtimeLoaderSource, "app/private.ts"),
      /dynamic import|runtime loader or compiler|runtime module-loader API/,
    );
  }
  const pythonBoundary = {
    declaredWorkspaceDependencies: new Set(),
    ownerImport: "zugfolge_data",
    ownerPackage: "zugfolge-data-pipeline",
    sourcePath: "apps/data-pipeline/src/zugfolge_data/provenance.py",
    workspaceImports: new Map([
      ["zugfolge_data", "zugfolge-data-pipeline"],
      ["zugfolge_odoo_bridge", "zugfolge-odoo-bridge"],
    ]),
  };
  assert.throws(
    () =>
      validatePythonModuleSource(
        "from zugfolge_odoo_bridge import sign_webhook",
        pythonBoundary,
      ),
    /undeclared workspace edge zugfolge-data-pipeline -> zugfolge-odoo-bridge/,
  );
  for (const pythonSource of [
    `from zugfolge_odoo_bridge \\
 import sign_webhook`,
    "if True: import zugfolge_odoo_bridge",
  ]) {
    assert.throws(
      () => validatePythonModuleSource(pythonSource, pythonBoundary),
      /undeclared workspace edge zugfolge-data-pipeline -> zugfolge-odoo-bridge/,
    );
  }
  for (const dynamicPythonSource of [
    '__import__("zugfolge_odoo_bridge")',
    'importlib.import_module("zugfolge_odoo_bridge")',
    'from importlib import import_module; import_module("zugfolge_odoo_bridge")',
    'from builtins import exec as run; run("import zugfolge_odoo_bridge")',
    'import builtins as b; getattr(b, "exec")("import zugfolge_odoo_bridge")',
  ]) {
    assert.throws(
      () => validatePythonModuleSource(dynamicPythonSource, pythonBoundary),
      /dynamic Python imports are forbidden/,
    );
  }
  assert.throws(
    () => validateKotlinSource("import de.zugfolge.other.internal.Secret"),
    /private or framework boundary/,
  );
});

test("reference confinement runs before the OpenAPI subprocess", async (context) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "zugfolge-contract-order-"));
  context.after(() => rm(root, { force: true, recursive: true }));
  const contractRoot = path.join(root, "packages", "contracts");
  const openApiPath = path.join(contractRoot, "openapi", "openapi.yaml");
  const asyncApiPath = path.join(contractRoot, "asyncapi", "livemap.yaml");
  await Promise.all([
    mkdir(path.dirname(openApiPath), { recursive: true }),
    mkdir(path.dirname(asyncApiPath), { recursive: true }),
  ]);
  let validatorCalls = 0;
  await assert.rejects(
    validateContractDocuments({
      asyncApi: {},
      asyncApiPath,
      contractRoot,
      openApi: { $ref: "https://attacker.invalid/openapi.yaml" },
      openApiPath,
      openApiValidator: () => {
        validatorCalls += 1;
      },
    }),
    /reference escapes packages\/contracts/,
  );
  assert.equal(validatorCalls, 0);
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
        totals: {
          functionsCovered: 1,
          functionsTotal: 1,
          rangesCovered: 1,
          rangesTotal: 1,
        },
      }),
    ),
    writeFile(
      path.join(nodePath, "test-results.xml"),
      '<testsuites><testcase name="passes" file="tests/example.test.mjs"/></testsuites>',
    ),
    writeFile(
      path.join(pythonPath, "coverage.json"),
      JSON.stringify({
        meta: { version: "7.15.2" },
        files: { "apps/example.py": { summary: {} } },
        totals: {
          covered_lines: 1,
          missing_lines: 0,
          num_statements: 1,
          percent_covered: 100,
        },
      }),
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
    writeFile(
      path.join(pythonPath, "coverage.xml"),
      '<coverage version="7.15.2" lines-valid="1" lines-covered="1"/>',
    ),
    writeFile(
      path.join(jvmReportPath, "jacocoTestReport.xml"),
      '<report name="game-server"><counter type="INSTRUCTION" missed="0" covered="1"/></report>',
    ),
    writeFile(
      path.join(jvmTestPath, "TEST-de.zugfolge.architecture.EngineeringBaselineTest.xml"),
      '<testsuite name="EngineeringBaselineTest" tests="1" skipped="0" failures="0" errors="0"><testcase name="passes"/></testsuite>',
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

test("local evidence verifier rejects empty or failed Node suites", async (context) => {
  const root = await evidenceFixture(context);
  const report = path.join(root, "outputs", "coverage", "node", "test-results.xml");
  await writeFile(report, "<testsuites/>");
  await assert.rejects(verifyLocalEvidence(root), /must contain tests/);
  await writeFile(
    report,
    '<testsuites><testcase name="fails"><failure/></testcase></testsuites>',
  );
  await assert.rejects(verifyLocalEvidence(root), /unsuccessful tests/);
});

test("local evidence verifier rejects failed and inconsistent JVM suites", async (context) => {
  const root = await evidenceFixture(context);
  const report = path.join(
    root,
    ".gradle-build",
    "apps",
    "game-server",
    "test-results",
    "test",
    "TEST-de.zugfolge.architecture.EngineeringBaselineTest.xml",
  );
  await writeFile(
    report,
    '<testsuite tests="1" skipped="0" failures="1" errors="0"><testcase name="fails"/></testsuite>',
  );
  await assert.rejects(verifyLocalEvidence(root), /contains failures/);
  await writeFile(
    report,
    '<testsuite tests="2" skipped="0" failures="0" errors="0"><testcase name="only-one"/></testsuite>',
  );
  await assert.rejects(verifyLocalEvidence(root), /test count is inconsistent/);
});

test("local evidence verifier rejects inconsistent and empty coverage", async (context) => {
  const root = await evidenceFixture(context);
  const nodeReport = path.join(root, "outputs", "coverage", "node", "coverage-summary.json");
  const nodeCoverage = JSON.parse(await readFile(nodeReport, "utf8"));
  nodeCoverage.totals.functionsCovered = 0;
  await writeFile(nodeReport, JSON.stringify(nodeCoverage));
  await assert.rejects(verifyLocalEvidence(root), /Node coverage totals are inconsistent/);

  await writeFile(
    nodeReport,
    JSON.stringify({
      ...nodeCoverage,
      totals: {
        functionsCovered: 1,
        functionsTotal: 1,
        rangesCovered: 1,
        rangesTotal: 1,
      },
    }),
  );
  const jacoco = path.join(
    root,
    ".gradle-build",
    "apps",
    "game-server",
    "reports",
    "jacoco",
    "test",
    "jacocoTestReport.xml",
  );
  await writeFile(jacoco, '<report name="game-server"/>');
  await assert.rejects(verifyLocalEvidence(root), /needs instruction counters/);
});

test("local evidence verifier rejects generic absolute and file-URI paths", async (context) => {
  const root = await evidenceFixture(context);
  const report = path.join(root, "outputs", "coverage", "node", "test-results.xml");
  for (const leakedPath of [
    "C:\\Users\\someone\\repo\\test.mjs",
    "/home/someone/repo/test.mjs",
    "file:///tmp/repo/test.mjs",
  ]) {
    await writeFile(
      report,
      `<testsuites><testcase name="passes" file="${leakedPath}"/></testsuites>`,
    );
    await assert.rejects(verifyLocalEvidence(root), /absolute path|file URI/);
  }
});
