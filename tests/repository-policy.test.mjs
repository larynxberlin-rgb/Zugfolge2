import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import test from "node:test";

const REPOSITORY_ROOT = new URL("../", import.meta.url);

test("repository remains explicitly unlicensed until the owner decides", async () => {
  const [packageJson, lockfile] = await Promise.all([
    readFile(new URL("../package.json", import.meta.url), "utf8").then(JSON.parse),
    readFile(new URL("../package-lock.json", import.meta.url), "utf8").then(
      JSON.parse,
    ),
  ]);

  assert.equal(packageJson.private, true);
  assert.equal(packageJson.license, "UNLICENSED");

  const dependenciesWithoutLicense = Object.entries(lockfile.packages)
    .filter(([path]) => path !== "")
    .filter(([, metadata]) => !metadata.license)
    .map(([path]) => path);

  assert.deepEqual(
    dependenciesWithoutLicense,
    [],
    `dependency license metadata missing: ${dependenciesWithoutLicense.join(", ")}`,
  );
});

test("tracked text files contain no recognizable credential material", async () => {
  const trackedFiles = execFileSync(
    "git",
    ["ls-files", "-z"],
    {
      cwd: REPOSITORY_ROOT,
      encoding: "utf8",
    },
  )
    .split("\0")
    .filter(Boolean);

  assert.equal(
    trackedFiles.some((path) => /^\.env(?:\.|$)/.test(path)),
    false,
    "environment files must not be tracked",
  );

  const signatures = [
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
    /\bAKIA[0-9A-Z]{16}\b/,
    /\bgh[oprsu]_[A-Za-z0-9_]{30,}\b/,
    /\bart_v1_[a-f0-9]{32,}\b/,
  ];

  const findings = [];
  for (const path of trackedFiles) {
    let content;
    try {
      content = await readFile(new URL(`../${path}`, import.meta.url));
    } catch (error) {
      if (error && typeof error === "object" && error.code === "ENOENT") {
        continue;
      }
      throw error;
    }
    if (content.includes(0)) continue;
    const text = content.toString("utf8");
    if (signatures.some((signature) => signature.test(text))) {
      findings.push(path);
    }
  }

  assert.deepEqual(findings, [], `possible credentials found: ${findings.join(", ")}`);
});
