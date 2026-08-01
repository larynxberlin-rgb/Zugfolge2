import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryPath = path.resolve(fileURLToPath(new URL("../", import.meta.url)));
const outputPath = path.join(repositoryPath, "outputs", "coverage", "node");
const rawPath = path.join(outputPath, "raw-v8");
const rawJunitPath = path.join(outputPath, "test-results.raw.xml");

await rm(outputPath, { force: true, recursive: true });
await mkdir(rawPath, { recursive: true });

const testFiles = (await readdir(path.join(repositoryPath, "tests")))
  .filter((file) => file.endsWith(".test.mjs"))
  .sort()
  .map((file) => path.join("tests", file));
assert.ok(testFiles.length > 0, "no Node test files discovered");

const result = spawnSync(process.execPath, [
  "--test",
  "--test-reporter=spec",
  "--test-reporter-destination=stdout",
  "--test-reporter=junit",
  `--test-reporter-destination=${rawJunitPath}`,
  ...testFiles,
], {
  cwd: repositoryPath,
  env: { ...process.env, NODE_V8_COVERAGE: rawPath },
  stdio: "inherit",
});
assert.equal(result.status, 0, `Node coverage test phase exited ${result.status}`);

const rawFiles = (await readdir(rawPath)).filter((file) => file.endsWith(".json")).sort();
assert.ok(rawFiles.length > 0, "Node emitted no V8 coverage documents");
const files = new Map();
for (const rawFile of rawFiles) {
  const document = JSON.parse(await readFile(path.join(rawPath, rawFile), "utf8"));
  assert.ok(Array.isArray(document.result), `${rawFile} has no V8 result array`);
  for (const script of document.result) {
    if (!script.url?.startsWith("file:")) continue;
    const absolutePath = fileURLToPath(script.url);
    const relativePath = path.relative(repositoryPath, absolutePath).replaceAll("\\", "/");
    if (relativePath.startsWith("../") || relativePath.includes("/node_modules/")) continue;
    const current = files.get(relativePath) ?? {
      functionsCovered: 0,
      functionsTotal: 0,
      rangesCovered: 0,
      rangesTotal: 0,
    };
    for (const fn of script.functions ?? []) {
      current.functionsTotal += 1;
      if ((fn.ranges?.[0]?.count ?? 0) > 0) current.functionsCovered += 1;
      for (const range of fn.ranges ?? []) {
        current.rangesTotal += 1;
        if (range.count > 0) current.rangesCovered += 1;
      }
    }
    files.set(relativePath, current);
  }
}
assert.ok(files.size > 0, "V8 coverage contains no repository files");

const fileEntries = [...files.entries()]
  .sort(([left], [right]) => left.localeCompare(right))
  .map(([file, coverage]) => ({ file, ...coverage }));
const totals = fileEntries.reduce(
  (sum, entry) => ({
    functionsCovered: sum.functionsCovered + entry.functionsCovered,
    functionsTotal: sum.functionsTotal + entry.functionsTotal,
    rangesCovered: sum.rangesCovered + entry.rangesCovered,
    rangesTotal: sum.rangesTotal + entry.rangesTotal,
  }),
  { functionsCovered: 0, functionsTotal: 0, rangesCovered: 0, rangesTotal: 0 },
);
await writeFile(
  path.join(outputPath, "coverage-summary.json"),
  `${JSON.stringify(
    {
      schemaVersion: 1,
      engine: `Node.js ${process.versions.node} V8`,
      files: fileEntries,
      totals,
    },
    null,
    2,
  )}\n`,
);
const rawJunit = await readFile(rawJunitPath, "utf8");
const sanitizedJunit = rawJunit
  .replaceAll(repositoryPath, ".")
  .replaceAll(repositoryPath.replaceAll("\\", "/"), ".");
assert.doesNotMatch(sanitizedJunit, new RegExp(repositoryPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
await writeFile(path.join(outputPath, "test-results.xml"), sanitizedJunit);
await rm(rawJunitPath, { force: true });
await rm(rawPath, { force: true, recursive: true });
console.log(`Node evidence: ${fileEntries.length} relative coverage files plus JUnit XML -> outputs/coverage/node`);
