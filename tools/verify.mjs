// SPDX-FileCopyrightText: 2026 Zugfolge contributors
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";

const REPOSITORY_ROOT = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const EVIDENCE_ROOT = path.join(REPOSITORY_ROOT, "outputs", "verification");
const SUMMARY_PATH = path.join(EVIDENCE_ROOT, "summary.json");

export const VERIFICATION_PHASES = Object.freeze([
  {
    id: "toolchain-preflight",
    commands: [["node", "tools/preflight.mjs"]],
  },
  {
    id: "frozen-dependencies",
    commands: [
      ["pnpm", "install", "--frozen-lockfile"],
      ["pnpm", "audit", "--audit-level=high"],
      ["uv", "sync", "--all-packages", "--locked"],
      ["node", "tools/verify-gradle-wrapper.mjs"],
    ],
  },
  {
    id: "specifications-and-contracts",
    commands: [["pnpm", "run", "verify:spec"]],
  },
  {
    id: "typescript",
    commands: [
      ["pnpm", "exec", "tsc", "--noEmit"],
      ["pnpm", "run", "lint"],
      ["pnpm", "test"],
    ],
  },
  {
    id: "python",
    commands: [
      [
        "uv",
        "run",
        "python",
        "-m",
        "compileall",
        "-q",
        "apps/data-pipeline/src",
        "integrations/odoo/src",
      ],
      ["uv", "run", "python", "tools/run-python-coverage.py"],
      [
        "uv",
        "build",
        "--package",
        "zugfolge-data-pipeline",
        "--build-constraints",
        "build-constraints.txt",
        "--require-hashes",
      ],
      [
        "uv",
        "build",
        "--package",
        "zugfolge-odoo-bridge",
        "--build-constraints",
        "build-constraints.txt",
        "--require-hashes",
      ],
    ],
  },
  {
    id: "kotlin",
    commands: [["gradlew", "--no-daemon", "--console=plain", "test", "jacocoTestReport"]],
  },
  {
    id: "repository-security",
    commands: [
      ["node", "tools/verify-workflows.mjs"],
      [
        "node",
        "--test",
        "tests/supply-chain-policy.test.mjs",
        "tests/repository-policy.test.mjs",
      ],
      ["gitleaks", "git", "--config=.gitleaks.toml", "--redact", "--no-banner"],
    ],
  },
  {
    id: "sbom-and-evidence",
    commands: [
      ["node", "tools/run-supply-chain.mjs"],
      ["node", "tools/verify-sbom.mjs"],
    ],
  },
]);

function sanitize(source) {
  const candidates = [
    REPOSITORY_ROOT,
    REPOSITORY_ROOT.replaceAll("\\", "/"),
    `file:///${REPOSITORY_ROOT.replaceAll("\\", "/")}`,
  ].sort((left, right) => right.length - left.length);
  return candidates.reduce(
    (value, candidate) => value.replaceAll(candidate, "."),
    String(source ?? ""),
  );
}

function executable(name) {
  if (name === "node") return process.execPath;
  if (process.platform !== "win32") return name === "gradlew" ? "./gradlew" : name;
  if (name === "gradlew") return "gradlew.bat";
  if (name === "pnpm") return "pnpm.cmd";
  return name;
}

function runCommand([name, ...args]) {
  const batch = process.platform === "win32" && (name === "gradlew" || name === "pnpm");
  const safeTokens = [executable(name), ...args];
  if (batch && safeTokens.some((token) => !/^[A-Za-z0-9_./:=+@,-]+$/.test(token))) {
    throw new Error(`VERIFY_COMMAND_REJECTED ${name}`);
  }
  const command = batch ? process.env.ComSpec : executable(name);
  const commandArgs = batch ? ["/d", "/s", "/c", safeTokens.join(" ")] : args;
  console.log(`$ ${name} ${args.join(" ")}`);
  const result = spawnSync(command, commandArgs, {
    cwd: REPOSITORY_ROOT,
    encoding: "utf8",
    env: process.env,
    shell: false,
  });
  const stdout = sanitize(result.stdout);
  const stderr = sanitize(result.stderr);
  if (stdout) process.stdout.write(stdout);
  if (stderr) process.stderr.write(stderr);
  if (result.error || result.status !== 0) {
    throw new Error(`VERIFY_COMMAND_FAILED ${name}`);
  }
  return { stderr, stdout };
}

function sha256(relativePath) {
  const bytes = readFileSync(path.join(REPOSITORY_ROOT, ...relativePath.split("/")));
  return createHash("sha256").update(bytes).digest("hex");
}

function artifactDigests() {
  const paths = [
    "outputs/coverage/jvm/jacoco.xml",
    "outputs/coverage/jvm/test-results.xml",
    "outputs/coverage/node/coverage-summary.json",
    "outputs/coverage/node/test-results.xml",
    "outputs/coverage/python/coverage.json",
    "outputs/coverage/python/coverage.xml",
    "outputs/coverage/python/test-results.json",
    "outputs/sbom/jvm.cdx.json",
    "outputs/sbom/manifest.json",
    "outputs/sbom/node.cdx.json",
    "outputs/sbom/python.cdx.json",
  ];
  return Object.fromEntries(paths.map((relativePath) => [relativePath, sha256(relativePath)]));
}

function writeSummary(summary) {
  assert.ok(EVIDENCE_ROOT.startsWith(`${REPOSITORY_ROOT}${path.sep}`));
  mkdirSync(EVIDENCE_ROOT, { recursive: true });
  writeFileSync(SUMMARY_PATH, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
}

export function runVerification(run = runCommand, { writeEvidence = true } = {}) {
  assert.ok(EVIDENCE_ROOT.startsWith(`${REPOSITORY_ROOT}${path.sep}`));
  if (writeEvidence) {
    rmSync(EVIDENCE_ROOT, { force: true, recursive: true });
  }
  const summary = {
    schemaVersion: 1,
    status: "RUNNING",
    tools: null,
    phases: [],
    artifactDigests: {},
  };
  for (const phase of VERIFICATION_PHASES) {
    const started = performance.now();
    try {
      const results = phase.commands.map((command) => run(command));
      if (phase.id === "toolchain-preflight") {
        const line = results[0].stdout.trim().split(/\r?\n/).at(-1);
        summary.tools = JSON.parse(line).tools;
      }
      summary.phases.push({
        durationMs: Math.round(performance.now() - started),
        id: phase.id,
        status: "PASSED",
      });
      if (writeEvidence) {
        writeSummary(summary);
      }
    } catch (error) {
      summary.status = "FAILED";
      summary.phases.push({
        durationMs: Math.round(performance.now() - started),
        id: phase.id,
        status: "FAILED",
      });
      if (writeEvidence) {
        writeSummary(summary);
      }
      throw new Error(`VERIFY_PHASE_FAILED ${phase.id}`, { cause: error });
    }
  }
  summary.artifactDigests = artifactDigests();
  summary.status = "PASSED";
  if (writeEvidence) {
    writeSummary(summary);
  }
  return summary;
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  try {
    const result = runVerification();
    console.log(`Verification passed: ${result.phases.length} phases.`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : "VERIFY_FAILED");
    process.exitCode = 1;
  }
}
