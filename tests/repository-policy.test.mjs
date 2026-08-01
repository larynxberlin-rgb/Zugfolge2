import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const REPOSITORY_ROOT = new URL("../", import.meta.url);

test("repository publishes one consistent file-level license matrix", async () => {
  const [
    packageJson,
    lockfile,
    rootLicense,
    reuse,
    dataPipelineProject,
    odooProject,
    contractsReadme,
  ] = await Promise.all([
    readFile(new URL("../package.json", import.meta.url), "utf8").then(JSON.parse),
    readFile(new URL("../package-lock.json", import.meta.url), "utf8").then(
      JSON.parse,
    ),
    readFile(new URL("../LICENSE", import.meta.url), "utf8"),
    readFile(new URL("../REUSE.toml", import.meta.url), "utf8"),
    readFile(
      new URL("../apps/data-pipeline/pyproject.toml", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../integrations/odoo/pyproject.toml", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../packages/contracts/README.md", import.meta.url),
      "utf8",
    ),
  ]);

  assert.equal(packageJson.private, true);
  assert.equal(packageJson.license, "AGPL-3.0-or-later");
  assert.equal(lockfile.packages[""].license, "AGPL-3.0-or-later");
  assert.match(rootLicense, /AGPL-3\.0-or-later/);
  assert.match(rootLicense, /Apache-2\.0/);
  assert.match(rootLicense, /CC-BY-4\.0/);
  assert.match(rootLicense, /ODbL-1\.0/);
  assert.match(rootLicense, /LicenseRef-Zugfolge-Provenance-Pending/);
  assert.match(dataPipelineProject, /^license = "AGPL-3\.0-or-later"$/m);
  assert.match(dataPipelineProject, /^license-files = \["LICENSE"\]$/m);
  assert.match(odooProject, /^license = "AGPL-3\.0-or-later"$/m);
  assert.match(odooProject, /^license-files = \["LICENSE"\]$/m);
  assert.match(contractsReadme, /Apache-2\.0/);

  for (const path of [
    "app/components/BlockZ.tsx",
    "app/lib/pilot-data.ts",
    "public/favicon.svg",
    "public/og.png",
  ]) {
    assert.match(reuse, new RegExp(path.replaceAll(".", "\\.")));
  }
  assert.match(
    reuse,
    /SPDX-License-Identifier = "LicenseRef-Zugfolge-Provenance-Pending"/,
  );

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

test("standard license texts retain their reviewed upstream bytes", async () => {
  const expected = new Map([
    [
      "AGPL-3.0-or-later.txt",
      "0D96A4FF68AD6D4B6F1F30F713B18D5184912BA8DD389F86AA7710DB079ABCB0",
    ],
    [
      "Apache-2.0.txt",
      "CFC7749B96F63BD31C3C42B5C471BF756814053E847C10F3EB003417BC523D30",
    ],
    [
      "CC-BY-4.0.txt",
      "9BA9550AD48438D0836DDAB3DA480B3B69FFA0AAC7B7878B5A0039E7AB429411",
    ],
  ]);

  for (const [file, digest] of expected) {
    const content = await readFile(new URL(`../LICENSES/${file}`, import.meta.url));
    assert.equal(
      createHash("sha256").update(content).digest("hex").toUpperCase(),
      digest,
      `${file} differs from the reviewed official text`,
    );
  }

  const canonicalAgpl = await readFile(
    new URL("../LICENSES/AGPL-3.0-or-later.txt", import.meta.url),
  );
  for (const path of [
    "../apps/data-pipeline/LICENSE",
    "../integrations/odoo/LICENSE",
  ]) {
    assert.deepEqual(
      await readFile(new URL(path, import.meta.url)),
      canonicalAgpl,
      `${path} must be the byte-identical wheel license`,
    );
  }
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
