// SPDX-FileCopyrightText: 2026 Zugfolge contributors
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { EXPECTED_TOOLS } from "../tools/preflight.mjs";
import { runVerification, VERIFICATION_PHASES } from "../tools/verify.mjs";

const REPOSITORY_ROOT = path.resolve(fileURLToPath(new URL("..", import.meta.url)));

test("root verification exposes the eight accepted ordered phases", () => {
  assert.deepEqual(
    VERIFICATION_PHASES.map(({ id }) => id),
    [
      "toolchain-preflight",
      "frozen-dependencies",
      "specifications-and-contracts",
      "typescript",
      "python",
      "kotlin",
      "repository-security",
      "sbom-and-evidence",
    ],
  );
  const calls = [];
  assert.throws(() =>
    runVerification(
      (command) => {
        calls.push(command);
        if (calls.length === 1) {
          return {
            stderr: "",
            stdout: `${JSON.stringify({ tools: { ...EXPECTED_TOOLS, platform: process.platform } })}\n`,
          };
        }
        throw new Error("synthetic dependency failure");
      },
      { writeEvidence: false },
    ),
  );
  assert.equal(calls.length, 2, "verification must stop on the first failed phase");
});

test("each supported tool mismatch fails in a child preflight", () => {
  for (const name of Object.keys(EXPECTED_TOOLS)) {
    const actual = { ...EXPECTED_TOOLS, platform: process.platform, [name]: "0.0.0-test" };
    const script = [
      "import { validateToolVersions } from './tools/preflight.mjs';",
      `validateToolVersions(${JSON.stringify(actual)});`,
    ].join("\n");
    const result = spawnSync(
      process.execPath,
      ["--input-type=module", "--eval", script],
      { cwd: REPOSITORY_ROOT, encoding: "utf8" },
    );
    assert.notEqual(result.status, 0, `${name} mismatch was accepted`);
    assert.match(`${result.stdout}${result.stderr}`, new RegExp(`PREFLIGHT_VERSION_MISMATCH ${name}`));
  }
});

test("child preflight does not create a Python environment or modify the uv lock", async () => {
  const sandbox = await mkdtemp(path.join(os.tmpdir(), "zugfolge-preflight-"));
  const environmentPath = path.join(sandbox, "project-env");
  const lockPath = path.join(REPOSITORY_ROOT, "uv.lock");
  const lockBefore = await readFile(lockPath);
  try {
    const result = spawnSync(process.execPath, ["tools/preflight.mjs"], {
      cwd: REPOSITORY_ROOT,
      encoding: "utf8",
      env: { ...process.env, UV_PROJECT_ENVIRONMENT: environmentPath },
    });
    assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
    await assert.rejects(access(environmentPath), { code: "ENOENT" });
    assert.deepEqual(await readFile(lockPath), lockBefore, "preflight modified uv.lock");
  } finally {
    await rm(sandbox, { force: true, recursive: true });
  }
});

test("CI uses explicit Windows and Linux images and the accepted command sequence", async () => {
  const workflow = await readFile(
    path.join(REPOSITORY_ROOT, ".github", "workflows", "ci.yml"),
    "utf8",
  );
  assert.match(workflow, /runner: ubuntu-24\.04/);
  assert.match(workflow, /runner: windows-2025/);
  assert.doesNotMatch(workflow, /\b(?:ubuntu|windows)-latest\b/);
  for (const command of [
    "node tools/preflight.mjs",
    "node --test tests/cross-platform-policy.test.mjs",
    "pnpm verify",
    "git diff --exit-code",
  ]) {
    assert.equal(workflow.match(new RegExp(command.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"))?.length, 1);
  }
  assert.match(workflow, /fetch-depth: 0/);
  assert.match(workflow, /zugfolge-ms002-\$\{\{ matrix\.id \}\}/);
});

test("documentation and package metadata expose one root interface", async () => {
  const files = await Promise.all(
    [
      "README.md",
      "docs/DEVELOPMENT.md",
      "apps/data-pipeline/README.md",
      "apps/game-server/README.md",
      "integrations/odoo/README.md",
    ].map((name) => readFile(path.join(REPOSITORY_ROOT, ...name.split("/")), "utf8")),
  );
  for (const source of files) assert.match(source, /pnpm verify/);
  const packageJson = JSON.parse(
    await readFile(path.join(REPOSITORY_ROOT, "package.json"), "utf8"),
  );
  assert.equal(packageJson.scripts.verify, "node tools/verify.mjs");
  const attributes = await readFile(path.join(REPOSITORY_ROOT, ".gitattributes"), "utf8");
  assert.match(attributes, /^\*\.mjs text eol=lf$/m);
});
