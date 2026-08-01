// SPDX-FileCopyrightText: 2026 Zugfolge contributors
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { EXPECTED_TOOLS } from "../tools/preflight.mjs";
import {
  formatCiSummary,
  runVerification,
  sanitizeVerificationOutput,
  VERIFICATION_PHASES,
} from "../tools/verify.mjs";

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

test("each supported tool mismatch fails through the complete child preflight", () => {
  for (const name of Object.keys(EXPECTED_TOOLS)) {
    const result = spawnSync(process.execPath, ["tools/preflight.mjs"], {
      cwd: REPOSITORY_ROOT,
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "test",
        ZUGFOLGE_PREFLIGHT_TEST_EXPECTED_MISMATCH: name,
      },
    });
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

test("empty checkout enters the orchestrator before pnpm may install dependencies", async () => {
  const sandbox = await mkdtemp(path.join(os.tmpdir(), "zugfolge-pnpm-entry-"));
  try {
    await Promise.all([
      writeFile(
        path.join(sandbox, "package.json"),
        `${JSON.stringify({
          dependencies: { "left-pad": "1.3.0" },
          packageManager: "pnpm@11.18.0",
          private: true,
          scripts: { probe: "node probe.mjs" },
        }, null, 2)}\n`,
        "utf8",
      ),
      writeFile(path.join(sandbox, "probe.mjs"), 'console.log("ORCHESTRATOR_FIRST");\n', "utf8"),
      readFile(path.join(REPOSITORY_ROOT, "pnpm-workspace.yaml"), "utf8").then((source) =>
        writeFile(path.join(sandbox, "pnpm-workspace.yaml"), source, "utf8"),
      ),
    ]);
    const batch = process.platform === "win32";
    const result = spawnSync(batch ? process.env.ComSpec : "pnpm", batch
      ? ["/d", "/s", "/c", "pnpm.cmd run probe"]
      : ["run", "probe"], {
      cwd: sandbox,
      encoding: "utf8",
      env: { ...process.env, npm_config_offline: "true" },
      shell: false,
    });
    assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
    assert.match(result.stdout, /ORCHESTRATOR_FIRST/);
    assert.doesNotMatch(`${result.stdout}${result.stderr}`, /Packages:|Content-addressable store/);
    await assert.rejects(access(path.join(sandbox, "node_modules")), { code: "ENOENT" });
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
  assert.match(workflow, /run: node tools\/verify\.mjs --write-ci-summary/);
  assert.doesNotMatch(workflow, /`/, "workflow shell commands must not contain backticks");
});

test("CI evidence summary validates and exposes the platform artifact digest", async () => {
  const digest = "a".repeat(64);
  const expected = `### MS-002 ubuntu-24.04\n- Retention: 30 days\n- SHA-256 digest: sha256:${digest}\n`;
  assert.equal(formatCiSummary("ubuntu-24.04", digest), expected);
  assert.throws(() => formatCiSummary("ubuntu-latest", digest), /CI_SUMMARY_PLATFORM_INVALID/);
  assert.throws(() => formatCiSummary("windows-2025", "not-a-digest"), /CI_SUMMARY_DIGEST_INVALID/);
  const sandbox = await mkdtemp(path.join(os.tmpdir(), "zugfolge-ci-summary-"));
  const summaryPath = path.join(sandbox, "summary.md");
  try {
    const result = spawnSync(process.execPath, ["tools/verify.mjs", "--write-ci-summary"], {
      cwd: REPOSITORY_ROOT,
      encoding: "utf8",
      env: {
        ...process.env,
        ARTIFACT_DIGEST: digest,
        GITHUB_STEP_SUMMARY: summaryPath,
        PLATFORM_ID: "ubuntu-24.04",
      },
    });
    assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
    assert.equal(await readFile(summaryPath, "utf8"), expected);
  } finally {
    await rm(sandbox, { force: true, recursive: true });
  }
});

test("verification output redacts repository, runner, and user-specific paths", () => {
  const source = [
    `${REPOSITORY_ROOT}/outputs`,
    "/home/runner/setup-pnpm/node_modules/.bin/store/v11",
    "C:\\Users\\alice\\AppData\\Local\\pnpm\\store",
    "file:///home/runner/work/Zugfolge/Zugfolge",
    "/ci/private/cache/archive",
  ].join("\n");
  const sanitized = sanitizeVerificationOutput(source, { PNPM_HOME: "/ci/private/cache" });
  assert.doesNotMatch(sanitized, /Bahnspiel|\/home\/runner|Users\\alice|\/ci\/private/);
  assert.match(sanitized, /\.\/outputs/);
  assert.match(sanitized, /<redacted-path>/);
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
  const workspace = await readFile(path.join(REPOSITORY_ROOT, "pnpm-workspace.yaml"), "utf8");
  assert.match(workspace, /^verifyDepsBeforeRun: false$/m);
});
