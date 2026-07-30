import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import YAML from "yaml";

const contractRoot = new URL("../packages/contracts/", import.meta.url);
const schemaRoot = new URL("json-schema/", contractRoot);
const exampleRoot = new URL("examples/", contractRoot);

const schemaFiles = [
  "disruption-policy.schema.json",
  "world-rules.schema.json",
  "train-run.schema.json",
  "occupation.schema.json",
  "ledger-entry.schema.json",
];

async function readJson(base, name) {
  return JSON.parse(await readFile(new URL(name, base), "utf8"));
}

async function createValidators() {
  const schemas = await Promise.all(
    schemaFiles.map((name) => readJson(schemaRoot, name)),
  );
  const ajv = new Ajv2020({
    allErrors: true,
    strict: true,
    strictRequired: false,
  });
  addFormats(ajv);

  for (const schema of schemas) {
    ajv.addSchema(schema);
  }

  return { ajv, schemas };
}

function assertValid(validate, value) {
  const valid = validate(value);
  assert.equal(valid, true, JSON.stringify(validate.errors, null, 2));
}

function walk(value, visitor, path = "$") {
  visitor(value, path);
  if (Array.isArray(value)) {
    value.forEach((entry, index) => walk(entry, visitor, `${path}[${index}]`));
  } else if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, entry]) =>
      walk(entry, visitor, `${path}.${key}`),
    );
  }
}

test("all JSON Schemas compile and canonical examples validate", async () => {
  const { ajv } = await createValidators();
  const [world, mixedPolicy, rejectedTrain] = await Promise.all([
    readJson(exampleRoot, "world-rules.manual.json"),
    readJson(exampleRoot, "disruption-policy.mixed.json"),
    readJson(exampleRoot, "train-run.rejected.json"),
  ]);

  assertValid(
    ajv.getSchema("https://schemas.zugfolge.de/v1/world-rules.schema.json"),
    world,
  );
  assertValid(
    ajv.getSchema(
      "https://schemas.zugfolge.de/v1/disruption-policy.schema.json",
    ),
    mixedPolicy,
  );
  assertValid(
    ajv.getSchema("https://schemas.zugfolge.de/v1/train-run.schema.json"),
    rejectedTrain,
  );
});

test("planned works and incidents may select independent modes", async () => {
  const { ajv } = await createValidators();
  const validate = ajv.getSchema(
    "https://schemas.zugfolge.de/v1/disruption-policy.schema.json",
  );
  const mixed = await readJson(exampleRoot, "disruption-policy.mixed.json");
  assertValid(validate, mixed);

  const missingRealisticProvider = structuredClone(mixed);
  delete missingRealisticProvider.providerSetId;
  assert.equal(validate(missingRealisticProvider), false);

  const silentSimulationFallback = structuredClone(mixed);
  silentSimulationFallback.onRealisticProviderUnavailable =
    "SWITCH_TO_SIMULATION";
  assert.equal(validate(silentSimulationFallback), false);
});

test("rejected runs require a reason and all contract times require UTC", async () => {
  const { ajv, schemas } = await createValidators();
  const validate = ajv.getSchema(
    "https://schemas.zugfolge.de/v1/train-run.schema.json",
  );
  const train = await readJson(exampleRoot, "train-run.rejected.json");

  const withoutReason = structuredClone(train);
  delete withoutReason.rejection;
  assert.equal(validate(withoutReason), false);

  const localOffset = structuredClone(train);
  localOffset.plannedStartAt = "2026-07-30T14:30:00+02:00";
  assert.equal(validate(localOffset), false);

  for (const schema of schemas) {
    walk(schema, (node, path) => {
      if (
        node &&
        typeof node === "object" &&
        node.format === "date-time"
      ) {
        assert.equal(node.pattern, "Z$", `${path} lacks a UTC-only pattern`);
      }
    });
  }
});

test("OpenAPI and AsyncAPI preserve recovery and bearer semantics", async () => {
  const [openApi, asyncApi] = await Promise.all([
    readFile(new URL("openapi/openapi.yaml", contractRoot), "utf8").then(
      YAML.parse,
    ),
    readFile(new URL("asyncapi/livemap.yaml", contractRoot), "utf8").then(
      YAML.parse,
    ),
  ]);

  assert.equal(openApi.openapi, "3.1.0");
  assert.equal(
    openApi.jsonSchemaDialect,
    "https://json-schema.org/draft/2020-12/schema",
  );
  assert.deepEqual(
    openApi.components.schemas.LiveMapSnapshot.properties.occupations.items
      .allOf[1].properties.phase.enum,
    ["RESERVED", "ACTIVE"],
  );

  assert.equal(asyncApi.asyncapi, "3.0.0");
  assert.equal(asyncApi.components.securitySchemes.bearerAuth.type, "http");
  assert.equal(asyncApi.components.securitySchemes.bearerAuth.scheme, "bearer");

  for (const schema of Object.values(asyncApi.components.schemas)) {
    assert.equal(
      schema.schemaFormat,
      "application/schema+json;version=draft-2020-12",
    );
    assert.equal(typeof schema.schema, "object");
  }
});

test("competitive contracts contain no payment-tier input", async () => {
  const files = await Promise.all([
    ...schemaFiles.map((name) => readFile(new URL(name, schemaRoot), "utf8")),
    readFile(new URL("openapi/openapi.yaml", contractRoot), "utf8"),
    readFile(new URL("asyncapi/livemap.yaml", contractRoot), "utf8"),
  ]);
  const source = files.join("\n").toLowerCase();
  assert.doesNotMatch(
    source,
    /paymenttier|subscriptiontier|premiumpriority|pluspriority/,
  );
});
