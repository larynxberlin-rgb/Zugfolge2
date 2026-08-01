import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import AsyncApiSpecs from "@asyncapi/specs";
import Ajv from "ajv";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import ts from "typescript";
import YAML from "yaml";

const ALLOWED_SPEC_STATUSES = new Set(["Accepted", "Proposed", "Superseded"]);
const ASYNCAPI_VALIDATOR = new Ajv({
  allErrors: true,
  strict: false,
  validateFormats: false,
}).compile(AsyncApiSpecs.schemasWithoutId["3.0.0"]);
const REDOCLY_CLI = fileURLToPath(
  import.meta.resolve("@redocly/cli/bin/cli.js"),
);

async function filesBelow(directory, predicate = () => true) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const entryPath = path.join(directory, entry.name);
      return entry.isDirectory()
        ? filesBelow(entryPath, predicate)
        : predicate(entryPath)
          ? [entryPath]
          : [];
    }),
  );
  return nested.flat().sort();
}

function walk(value, visitor) {
  visitor(value);
  if (Array.isArray(value)) {
    for (const entry of value) walk(entry, visitor);
  } else if (value && typeof value === "object") {
    for (const entry of Object.values(value)) walk(entry, visitor);
  }
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function requireRecord(value, label) {
  assert.ok(isRecord(value), `${label} must be an object`);
  return value;
}

function validateJsonSchemaShape(schema, label) {
  requireRecord(schema, label);
  const ajv = new Ajv2020({ allErrors: true, strict: true, strictRequired: false });
  addFormats(ajv);
  assert.equal(
    ajv.validateSchema(schema),
    true,
    `${label} is not valid JSON Schema 2020-12: ${ajv.errorsText(ajv.errors)}`,
  );
}

function schemaErrors(label, errors) {
  return `${label} violates its official schema: ${(errors ?? [])
    .map(({ instancePath, message }) => `${instancePath || "/"} ${message}`)
    .join("; ")}`;
}

function redoclyErrors(report) {
  return (report?.problems ?? [])
    .map(({ ruleId, message, location }) => {
      const pointer = location?.[0]?.pointer ?? "/";
      return `${ruleId ?? "struct"} ${pointer}: ${message}`;
    })
    .join("; ");
}

export function validateOpenApiFile(filePath) {
  const result = spawnSync(
    process.execPath,
    [REDOCLY_CLI, "lint", "--extends=spec", "--format=json", filePath],
    {
      cwd: path.dirname(filePath),
      encoding: "utf8",
      env: { ...process.env, NO_COLOR: "1" },
      timeout: 30_000,
    },
  );
  assert.ifError(result.error);
  let report;
  try {
    report = JSON.parse(result.stdout);
  } catch {
    assert.fail("OpenAPI validator did not emit machine-readable JSON");
  }
  assert.equal(
    result.status,
    0,
    `OpenAPI 3.1 violates the pinned spec validator: ${redoclyErrors(report)}`,
  );
  assert.equal(report?.totals?.errors, 0, "OpenAPI validation reported errors");
  return report;
}

export function validateSpecificationIdentity(fileName, source) {
  const expected = fileName.match(/^(FEAT-\d{4}|ADR-\d{4})-/)?.[1];
  assert.ok(expected, `${fileName} needs an FEAT-nnnn or ADR-nnnn prefix`);
  const heading = source.match(/^#\s+(FEAT-\d{4}|ADR-\d{4}):/m)?.[1];
  assert.equal(heading, expected, `${fileName} heading must declare ${expected}`);
  const status = source.match(/^\*\*Status:\*\*\s*([^\\\r\n]+)/m)?.[1]?.trim();
  assert.ok(status && ALLOWED_SPEC_STATUSES.has(status), `${expected} has invalid status`);
  if (expected.startsWith("FEAT-")) {
    assert.match(source, /^\*\*Version:\*\*\s*\d+\.\d+/m, `${expected} needs a version`);
  }
  return expected;
}

export function compileJsonSchemas(schemas) {
  const ajv = new Ajv2020({ allErrors: true, strict: true, strictRequired: false });
  addFormats(ajv);
  for (const [index, schema] of schemas.entries()) {
    validateJsonSchemaShape(schema, `JSON Schema ${schema?.$id ?? index}`);
    ajv.addSchema(schema);
  }
  for (const [index, schema] of schemas.entries()) {
    const compiled = schema.$id ? ajv.getSchema(schema.$id) : ajv.compile(schema);
    assert.ok(compiled, `JSON Schema ${schema.$id ?? index} could not be compiled`);
  }
  return ajv;
}

export function validateOpenApi(document) {
  requireRecord(document, "OpenAPI document");
  assert.equal(document.openapi, "3.1.0", "OpenAPI must remain 3.1.0");
  assert.equal(
    document.jsonSchemaDialect,
    "https://json-schema.org/draft/2020-12/schema",
    "OpenAPI must use JSON Schema 2020-12",
  );
  const temporaryRoot = mkdtempSync(path.join(os.tmpdir(), "zugfolge-openapi-"));
  try {
    const filePath = path.join(temporaryRoot, "openapi.yaml");
    writeFileSync(filePath, YAML.stringify(document), "utf8");
    return validateOpenApiFile(filePath);
  } finally {
    rmSync(temporaryRoot, { force: true, recursive: true });
  }
}

export function validateAsyncApi(document) {
  requireRecord(document, "AsyncAPI document");
  assert.equal(document.asyncapi, "3.0.0", "AsyncAPI must remain 3.0.0");
  assert.equal(
    ASYNCAPI_VALIDATOR(document),
    true,
    schemaErrors("AsyncAPI 3.0", ASYNCAPI_VALIDATOR.errors),
  );
  requireRecord(document.channels, "AsyncAPI channels");
  assert.ok(Object.keys(document.channels).length > 0, "AsyncAPI channels are missing");
  requireRecord(document.operations, "AsyncAPI operations");
  assert.ok(Object.keys(document.operations).length > 0, "AsyncAPI operations are missing");
  requireRecord(document.components?.schemas, "AsyncAPI component schemas");
}

function resolvePointer(document, fragment, reference) {
  if (!fragment) return document;
  assert.ok(fragment.startsWith("/"), `unsupported reference fragment ${reference}`);
  return fragment
    .slice(1)
    .split("/")
    .map((token) => token.replaceAll("~1", "/").replaceAll("~0", "~"))
    .reduce((value, token) => value?.[token], document);
}

async function readDocument(filePath) {
  const source = await readFile(filePath, "utf8");
  return filePath.endsWith(".json") ? JSON.parse(source) : YAML.parse(source);
}

async function validateReferences(document, documentPath, contractRoot) {
  const references = [];
  walk(document, (value) => {
    if (value && typeof value === "object" && typeof value.$ref === "string") {
      references.push(value.$ref);
    }
  });
  const rootPrefix = `${path.resolve(contractRoot)}${path.sep}`;
  for (const reference of references) {
    const [relativeFile, fragment = ""] = reference.split("#", 2);
    assert.doesNotMatch(
      relativeFile,
      /^[A-Za-z][A-Za-z0-9+.-]*:/,
      `${documentPath} reference escapes packages/contracts: ${reference}`,
    );
    assert.ok(
      !path.isAbsolute(relativeFile),
      `${documentPath} reference escapes packages/contracts: ${reference}`,
    );
    const targetPath = relativeFile
      ? path.resolve(path.dirname(documentPath), relativeFile)
      : path.resolve(documentPath);
    assert.ok(
      targetPath.startsWith(rootPrefix),
      `${documentPath} reference escapes packages/contracts: ${reference}`,
    );
    const target = relativeFile ? await readDocument(targetPath) : document;
    assert.notEqual(
      resolvePointer(target, fragment, reference),
      undefined,
      `${documentPath} contains unresolved reference ${reference}`,
    );
  }
}

const FORBIDDEN_IMPORT_SEGMENTS = new Set([
  ".cache",
  ".gradle-build",
  ".next",
  ".pnpm",
  ".venv",
  ".vinext",
  "dist",
  "node_modules",
  "outputs",
  "out",
  "work",
]);

function assertSafeImportPath(specifier, sourcePath) {
  const segments = specifier.replaceAll("\\", "/").split("/");
  assert.ok(
    !segments.some((segment) => FORBIDDEN_IMPORT_SEGMENTS.has(segment)),
    `${sourcePath} imports forbidden generated/private path ${specifier}`,
  );
  assert.doesNotMatch(
    specifier.replaceAll("\\", "/"),
    /(?:^|\/)(?:apps|integrations|packages)\/[^/]+\/src(?:\/|$)/,
    `${sourcePath} imports another module's private source tree ${specifier}`,
  );
}

export function validateJavaScriptModuleSource(source, sourcePath = "JavaScript source") {
  const scriptKind = sourcePath.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const syntaxTree = ts.createSourceFile(
    sourcePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    scriptKind,
  );
  assert.deepEqual(
    syntaxTree.parseDiagnostics,
    [],
    `${sourcePath} cannot be parsed for module-boundary validation`,
  );
  const specifiers = [];
  const forbiddenRuntimeIdentifiers = new Set([
    "create" + "Require",
    "ev" + "al",
    "Fun" + "ction",
    "requ" + "ire",
  ]);
  const visit = (node) => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteralLike(node.moduleSpecifier)
    ) {
      specifiers.push(node.moduleSpecifier.text);
    }
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      assert.ok(
        node.arguments.length === 1 && ts.isStringLiteralLike(node.arguments[0]),
        `${sourcePath} uses a non-literal dynamic import that cannot be boundary-checked`,
      );
      specifiers.push(node.arguments[0].text);
    }
    if (ts.isIdentifier(node) && forbiddenRuntimeIdentifiers.has(node.text)) {
      assert.fail(
        `${sourcePath} uses a runtime loader or compiler that cannot be boundary-checked`,
      );
    }
    ts.forEachChild(node, visit);
  };
  visit(syntaxTree);
  for (const specifier of specifiers) {
    assert.ok(!path.isAbsolute(specifier), `${sourcePath} imports absolute path ${specifier}`);
    assert.doesNotMatch(
      specifier,
      /^(?:apps|integrations|packages)(?:\/|$)/,
      `${sourcePath} imports bare repository path ${specifier}; use a declared package export`,
    );
    if (
      specifier.startsWith(".") ||
      specifier.includes("\\") ||
      /^(?:apps|integrations|packages|node_modules|outputs|work|\.gradle-build|\.pnpm|\.venv)(?:\/|$)/.test(
        specifier,
      )
    ) {
      assertSafeImportPath(specifier, sourcePath);
    }
  }
}

function pythonImportRoots(source) {
  const roots = [];
  const normalized = source.replace(/\\\r?\n/g, " ");
  assert.doesNotMatch(
    normalized,
    /\b(?:__builtins__|__getattribute__|__import__|builtins|compile|eval|exec|getattr|globals|importlib|locals)\b/,
    "dynamic Python imports are forbidden because their module edge is not statically reviewable",
  );
  for (const from of normalized.matchAll(
    /\bfrom\s+([A-Za-z_]\w*(?:\s*\.\s*[A-Za-z_]\w*)*)\s+import\b/g,
  )) {
    const module = from[1].replaceAll(/\s/g, "");
    roots.push({ module, root: module.split(".")[0] });
  }
  for (const imported of normalized.matchAll(
    /(?:^|[;:\n])\s*import\s+([^;\r\n]+)/g,
  )) {
    for (const entry of imported[1].split(",")) {
      const module = entry.trim().split(/\s+as\s+/)[0];
      if (/^[A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*$/.test(module)) {
        roots.push({ module, root: module.split(".")[0] });
      }
    }
  }
  return roots;
}

export function validatePythonModuleSource(
  source,
  {
    declaredWorkspaceDependencies = new Set(),
    ownerImport,
    ownerPackage,
    sourcePath = "Python source",
    workspaceImports = new Map(),
  },
) {
  for (const { module, root } of pythonImportRoots(source)) {
    const targetPackage = workspaceImports.get(root);
    if (!targetPackage || root === ownerImport) continue;
    assert.ok(
      declaredWorkspaceDependencies.has(targetPackage),
      `${sourcePath} creates undeclared workspace edge ${ownerPackage} -> ${targetPackage} via ${module}`,
    );
    assert.ok(
      !module.split(".").some((segment) => segment.startsWith("_")),
      `${sourcePath} imports private API ${module} from ${targetPackage}`,
    );
  }
}

export function validateKotlinSource(source, sourcePath = "Kotlin source") {
  const forbidden = /^(?:import\s+)(?:apps\.|integrations\.|src\.main\.|.*\.internal\.|org\.springframework\.|io\.ktor\.|io\.micronaut\.)/m;
  assert.doesNotMatch(source, forbidden, `${sourcePath} crosses a private or framework boundary`);
}

export async function validateContractDocuments({
  asyncApi,
  asyncApiPath,
  contractRoot,
  openApi,
  openApiPath,
  openApiValidator = validateOpenApiFile,
}) {
  await Promise.all([
    validateReferences(openApi, openApiPath, contractRoot),
    validateReferences(asyncApi, asyncApiPath, contractRoot),
  ]);
  requireRecord(openApi, "OpenAPI document");
  assert.equal(openApi.openapi, "3.1.0", "OpenAPI must remain 3.1.0");
  assert.equal(
    openApi.jsonSchemaDialect,
    "https://json-schema.org/draft/2020-12/schema",
    "OpenAPI must use JSON Schema 2020-12",
  );
  openApiValidator(openApiPath);
  validateAsyncApi(asyncApi);
}

export async function verifySpecificationTree(repositoryPath) {
  const specificationRoot = path.join(repositoryPath, "spec");
  const contractRoot = path.join(repositoryPath, "packages", "contracts");
  const identityFiles = [
    ...(await filesBelow(path.join(specificationRoot, "features"), (file) => file.endsWith(".md"))),
    ...(await filesBelow(path.join(specificationRoot, "adr"), (file) => file.endsWith(".md"))),
  ];
  const identities = [];
  for (const file of identityFiles) {
    identities.push(
      validateSpecificationIdentity(path.basename(file), await readFile(file, "utf8")),
    );
  }
  assert.equal(new Set(identities).size, identities.length, "specification IDs must be unique");

  const schemaFiles = await filesBelow(
    path.join(contractRoot, "json-schema"),
    (file) => file.endsWith(".schema.json"),
  );
  const schemas = await Promise.all(schemaFiles.map(readDocument));
  compileJsonSchemas(schemas);

  const openApiPath = path.join(contractRoot, "openapi", "openapi.yaml");
  const asyncApiPath = path.join(contractRoot, "asyncapi", "livemap.yaml");
  const [openApi, asyncApi] = await Promise.all([
    readDocument(openApiPath),
    readDocument(asyncApiPath),
  ]);
  await validateContractDocuments({
    asyncApi,
    asyncApiPath,
    contractRoot,
    openApi,
    openApiPath,
  });

  const rootPackage = JSON.parse(
    await readFile(path.join(repositoryPath, "package.json"), "utf8"),
  );
  assert.equal(rootPackage.name, "zugfolge", "root JavaScript package identity is missing");
  assert.equal(
    rootPackage.exports?.["./domain"],
    "./packages/domain/index.mjs",
    "domain kernel needs a declared root-package export",
  );
  const javaScriptRoots = ["app", "build", "packages/domain", "scripts", "tools", "worker"];
  const javaScriptSources = (
    await Promise.all(
      javaScriptRoots.map((directory) =>
        filesBelow(path.join(repositoryPath, directory), (file) =>
          /\.(?:js|mjs|ts|tsx)$/.test(file),
        ),
      ),
    )
  ).flat();
  javaScriptSources.push(
    path.join(repositoryPath, "eslint.config.mjs"),
    path.join(repositoryPath, "vite.config.ts"),
  );
  for (const sourcePath of javaScriptSources) {
    validateJavaScriptModuleSource(await readFile(sourcePath, "utf8"), sourcePath);
  }

  const pythonMembers = [
    { directory: "apps/data-pipeline", importName: "zugfolge_data" },
    { directory: "integrations/odoo", importName: "zugfolge_odoo_bridge" },
  ];
  for (const member of pythonMembers) {
    const projectSource = await readFile(
      path.join(repositoryPath, member.directory, "pyproject.toml"),
      "utf8",
    );
    member.projectName = projectSource.match(/^name = "([^"]+)"$/m)?.[1];
    assert.ok(member.projectName, `${member.directory} needs a Python package identity`);
    const dependencyBlock = projectSource.match(/^dependencies = \[([\s\S]*?)\]$/m)?.[1] ?? "";
    member.dependencies = new Set(
      [...dependencyBlock.matchAll(/"([A-Za-z0-9_.-]+)/g)].map((match) => match[1]),
    );
  }
  assert.equal(
    new Set(pythonMembers.map(({ projectName }) => projectName)).size,
    pythonMembers.length,
    "Python workspace package identities must be unique",
  );
  const workspaceImports = new Map(
    pythonMembers.map(({ importName, projectName }) => [importName, projectName]),
  );
  const pythonSources = [];
  for (const member of pythonMembers) {
    const memberSources = await filesBelow(
      path.join(repositoryPath, member.directory, "src"),
      (file) => file.endsWith(".py"),
    );
    pythonSources.push(...memberSources);
    for (const sourcePath of memberSources) {
      validatePythonModuleSource(await readFile(sourcePath, "utf8"), {
        declaredWorkspaceDependencies: member.dependencies,
        ownerImport: member.importName,
        ownerPackage: member.projectName,
        sourcePath,
        workspaceImports,
      });
    }
  }

  const settingsSource = await readFile(
    path.join(repositoryPath, "settings.gradle.kts"),
    "utf8",
  );
  assert.match(
    settingsSource,
    /include\(":apps:game-server"\)/,
    "game-server needs an explicit Gradle project identity",
  );

  const kotlinSources = await filesBelow(
    path.join(repositoryPath, "apps", "game-server", "src", "main", "kotlin"),
    (file) => file.endsWith(".kt"),
  );
  assert.ok(kotlinSources.length > 0, "game-server has no production Kotlin source");
  for (const sourcePath of kotlinSources) {
    validateKotlinSource(await readFile(sourcePath, "utf8"), sourcePath);
  }

  return {
    asyncApiDocuments: 1,
    javaScriptSources: javaScriptSources.length,
    jsonSchemas: schemas.length,
    kotlinSources: kotlinSources.length,
    openApiDocuments: 1,
    pythonPackages: pythonMembers.length,
    pythonSources: pythonSources.length,
    specifications: identities.length,
  };
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const repositoryPath = path.resolve(fileURLToPath(new URL("../", import.meta.url)));
  const evidence = await verifySpecificationTree(repositoryPath);
  console.log(
    `Verified ${evidence.specifications} specs/ADRs, ${evidence.jsonSchemas} JSON Schemas, OpenAPI, AsyncAPI, and ${evidence.javaScriptSources + evidence.pythonSources + evidence.kotlinSources} module source(s).`,
  );
}
