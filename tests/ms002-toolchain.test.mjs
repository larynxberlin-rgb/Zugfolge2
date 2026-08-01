import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { parse as parseYaml } from "yaml";

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
