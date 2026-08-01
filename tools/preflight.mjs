// SPDX-FileCopyrightText: 2026 Zugfolge contributors
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  verifyApprovedJavaRuntime,
  verifyGradleWrapper,
} from "./verify-gradle-wrapper.mjs";

const REPOSITORY_ROOT = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
export const EXPECTED_TOOLS = Object.freeze({
  gradle: "9.5.0",
  java: "21.0.12+8-LTS",
  node: "24.18.0",
  pnpm: "11.18.0",
  python: "3.13.14",
  uv: "0.12.0",
});

const INSTALL_SOURCES = Object.freeze({
  gradle: "https://gradle.org/releases/",
  java: "https://adoptium.net/temurin/releases/",
  node: "https://nodejs.org/en/download/",
  pnpm: "https://www.npmjs.com/package/pnpm/v/11.18.0",
  python: "https://www.python.org/downloads/release/python-31314/",
  uv: "https://docs.astral.sh/uv/getting-started/installation/",
});

function runVersionCommand(name, args) {
  const batch = process.platform === "win32" && name === "pnpm";
  const executable = batch ? "pnpm.cmd" : name;
  const safeTokens = [executable, ...args];
  if (batch && safeTokens.some((token) => !/^[A-Za-z0-9_./:=+@-]+$/.test(token))) {
    throw new Error(`PREFLIGHT_COMMAND_REJECTED ${name}`);
  }
  const command = batch ? process.env.ComSpec : executable;
  const commandArgs = batch ? ["/d", "/s", "/c", safeTokens.join(" ")] : args;
  const result = spawnSync(command, commandArgs, {
    cwd: REPOSITORY_ROOT,
    encoding: "utf8",
    env: process.env,
    shell: false,
  });
  if (result.error || result.status !== 0) {
    throw new Error(`PREFLIGHT_TOOL_UNAVAILABLE ${name}; install from ${INSTALL_SOURCES[name]}`);
  }
  return `${result.stdout ?? ""}\n${result.stderr ?? ""}`.trim();
}

export function validateToolVersions(actual) {
  for (const [name, expected] of Object.entries(EXPECTED_TOOLS)) {
    assert.equal(
      actual[name],
      expected,
      `PREFLIGHT_VERSION_MISMATCH ${name}: expected ${expected}; install from ${INSTALL_SOURCES[name]}`,
    );
  }
  assert.ok(
    actual.platform === "linux" || actual.platform === "win32",
    `PREFLIGHT_PLATFORM_UNSUPPORTED ${actual.platform}`,
  );
  return { ...actual };
}

export async function collectToolVersions() {
  const pnpm = runVersionCommand("pnpm", ["--version"]);
  const uvOutput = runVersionCommand("uv", ["--version"]);
  const pythonOutput = runVersionCommand("uv", ["run", "python", "--version"]);
  const java = await verifyApprovedJavaRuntime();
  const gradle = await verifyGradleWrapper(REPOSITORY_ROOT);
  return validateToolVersions({
    gradle: gradle.gradleVersion,
    java: java.runtimeVersion,
    node: process.versions.node,
    platform: process.platform,
    pnpm: pnpm.trim(),
    python: pythonOutput.match(/Python\s+([^\s]+)/)?.[1],
    uv: uvOutput.match(/^uv\s+([^\s]+)/)?.[1],
  });
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  try {
    const tools = await collectToolVersions();
    console.log(JSON.stringify({ schemaVersion: 1, status: "PASSED", tools }));
  } catch (error) {
    console.error(error instanceof Error ? error.message : "PREFLIGHT_FAILED");
    process.exitCode = 1;
  }
}
