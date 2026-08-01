import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import YAML from "yaml";

const ALLOWED_SPEC_STATUSES = new Set(["Accepted", "Proposed", "Superseded"]);

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
  for (const schema of schemas) ajv.addSchema(schema);
  return ajv;
}

export function validateOpenApi(document) {
  assert.equal(document.openapi, "3.1.0", "OpenAPI must remain 3.1.0");
  assert.equal(document.jsonSchemaDialect, "https://json-schema.org/draft/2020-12/schema");
  assert.ok(document.info?.title && document.info?.version, "OpenAPI info is incomplete");
  assert.ok(document.paths && typeof document.paths === "object", "OpenAPI paths are missing");
  const operationIds = [];
  for (const [route, item] of Object.entries(document.paths)) {
    assert.match(route, /^\//, `OpenAPI path ${route} must start with /`);
    for (const method of ["get", "put", "post", "delete", "patch", "head", "options", "trace"]) {
      const operation = item?.[method];
      if (!operation) continue;
      assert.ok(operation.operationId, `${method.toUpperCase()} ${route} needs operationId`);
      assert.ok(operation.responses && typeof operation.responses === "object", `${operation.operationId} needs responses`);
      operationIds.push(operation.operationId);
    }
  }
  assert.equal(new Set(operationIds).size, operationIds.length, "OpenAPI operationId values must be unique");
}

export function validateAsyncApi(document) {
  assert.equal(document.asyncapi, "3.0.0", "AsyncAPI must remain 3.0.0");
  assert.ok(document.info?.title && document.info?.version, "AsyncAPI info is incomplete");
  assert.ok(document.channels && Object.keys(document.channels).length > 0, "AsyncAPI channels are missing");
  assert.ok(document.operations && Object.keys(document.operations).length > 0, "AsyncAPI operations are missing");
  assert.ok(document.components?.schemas, "AsyncAPI component schemas are missing");
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

export function validateKotlinSource(source, sourcePath = "Kotlin source") {
  const forbidden = /^(?:import\s+)(?:apps\.|integrations\.|src\.main\.|org\.springframework\.|io\.ktor\.|io\.micronaut\.)/m;
  assert.doesNotMatch(source, forbidden, `${sourcePath} crosses a private or framework boundary`);
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
  validateOpenApi(openApi);
  validateAsyncApi(asyncApi);
  await Promise.all([
    validateReferences(openApi, openApiPath, contractRoot),
    validateReferences(asyncApi, asyncApiPath, contractRoot),
  ]);

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
    jsonSchemas: schemas.length,
    kotlinSources: kotlinSources.length,
    openApiDocuments: 1,
    specifications: identities.length,
  };
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const repositoryPath = path.resolve(fileURLToPath(new URL("../", import.meta.url)));
  const evidence = await verifySpecificationTree(repositoryPath);
  console.log(
    `Verified ${evidence.specifications} specs/ADRs, ${evidence.jsonSchemas} JSON Schemas, OpenAPI, AsyncAPI, and ${evidence.kotlinSources} Kotlin source(s).`,
  );
}
