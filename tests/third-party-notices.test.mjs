import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";
import { parse as parseYaml } from "yaml";
import {
  checkThirdPartyNotices,
  DISTRIBUTED_WEB_PACKAGES,
  generateThirdPartyNotices,
  normalizedTextSha256,
} from "../scripts/generate-third-party-notices.mjs";

const lockSource = await readFile(
  new URL("../pnpm-lock.yaml", import.meta.url),
  "utf8",
);
const lock = parseYaml(lockSource);

function productionClosure() {
  const queue = Object.entries(lock.importers["."].dependencies ?? {}).map(
    ([name, reference]) => [name, reference.version],
  );
  const visitedKeys = new Set();
  const visitedNames = new Set();
  while (queue.length > 0) {
    const [name, reference] = queue.shift();
    const snapshotKey = `${name}@${reference}`;
    if (visitedKeys.has(snapshotKey)) continue;
    visitedKeys.add(snapshotKey);
    visitedNames.add(name);
    const version = reference.replace(/\(.*/, "");
    assert.ok(
      lock.packages[`${name}@${version}`],
      `${name}@${version} is missing from pnpm-lock.yaml`,
    );
    const snapshot = lock.snapshots[snapshotKey];
    assert.ok(snapshot, `${snapshotKey} has no pnpm snapshot`);
    queue.push(...Object.entries(snapshot.dependencies ?? {}));
  }
  return [...visitedNames].sort();
}

test("web notice is deterministic and covers runtime plus emitted build code", async () => {
  await checkThirdPartyNotices();
  const notice = await generateThirdPartyNotices();
  const lockDigest = normalizedTextSha256(lockSource);

  assert.deepEqual(productionClosure(), ["react", "react-dom", "scheduler"]);
  assert.ok(notice.includes(`pnpm-lock.yaml SHA-256: ${lockDigest}`));
  for (const name of productionClosure()) {
    assert.ok(
      DISTRIBUTED_WEB_PACKAGES.includes(name),
      `${name} runtime license is absent from the notice set`,
    );
  }
  for (const expected of [
    "react@19.2.8",
    "react-dom@19.2.8",
    "scheduler@0.27.0",
    "react-server-dom-webpack@19.2.8",
    "tailwindcss@4.2.1",
    "vinext@0.0.50",
    "rolldown@1.2.1",
    "vite@8.2.0",
    "Copyright (c) Meta Platforms, Inc. and affiliates.",
    "Copyright (c) Tailwind Labs, Inc.",
    "Copyright (c) 2026 Cloudflare, Inc.",
  ]) {
    assert.ok(notice.includes(expected), `${expected} is missing from notices`);
  }
});

test("notice lock digest is invariant across platform line endings", () => {
  const lf = '{\n  "name": "zugfolge"\n}\n';
  const crlf = lf.replaceAll("\n", "\r\n");
  const cr = lf.replaceAll("\n", "\r");

  assert.equal(normalizedTextSha256(crlf), normalizedTextSha256(lf));
  assert.equal(normalizedTextSha256(cr), normalizedTextSha256(lf));
  assert.notEqual(
    createHash("sha256").update(crlf).digest("hex"),
    createHash("sha256").update(lf).digest("hex"),
    "the fixture must exercise distinct raw bytes",
  );
});

test("built web artifact ships notices and retains upstream license banners", async () => {
  const [publicNotice, distributedNotice, serverBundle, clientFiles, distFiles] =
    await Promise.all([
      readFile(
        new URL("../public/legal/THIRD-PARTY-NOTICES.txt", import.meta.url),
        "utf8",
      ),
      readFile(
        new URL(
          "../dist/client/legal/THIRD-PARTY-NOTICES.txt",
          import.meta.url,
        ),
        "utf8",
      ),
      readFile(new URL("../dist/server/index.js", import.meta.url), "utf8"),
      readdir(new URL("../dist/client/", import.meta.url), {
        recursive: true,
      }),
      readdir(new URL("../dist/", import.meta.url), {
        recursive: true,
      }),
    ]);

  assert.equal(distributedNotice, publicNotice);
  assert.match(serverBundle, /@license React/);
  assert.match(serverBundle, /Copyright \(c\) Meta Platforms/);

  const cssFile = clientFiles.find((path) =>
    path.replaceAll("\\", "/").match(/^assets\/index-.*\.css$/),
  );
  assert.ok(cssFile, "built client CSS is missing");
  assert.match(
    await readFile(new URL(`../dist/client/${cssFile}`, import.meta.url), "utf8"),
    /tailwindcss v4\.2\.1 \| MIT License/,
  );

  const forbiddenArtifacts = distFiles.filter((path) =>
    /(?:^|[/\\])node_modules(?:[/\\]|$)|\.node$|libvips|lightningcss/i.test(
      path,
    ),
  );
  assert.deepEqual(
    forbiddenArtifacts,
    [],
    `build-only/native artifacts leaked into dist: ${forbiddenArtifacts}`,
  );
});
