import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";
import {
  checkThirdPartyNotices,
  DISTRIBUTED_WEB_PACKAGES,
  generateThirdPartyNotices,
} from "../scripts/generate-third-party-notices.mjs";

const lockSource = await readFile(
  new URL("../package-lock.json", import.meta.url),
  "utf8",
);
const lock = JSON.parse(lockSource);

function productionClosure() {
  const queue = Object.keys(lock.packages[""].dependencies ?? {});
  const visited = new Set();
  while (queue.length > 0) {
    const name = queue.shift();
    if (visited.has(name)) continue;
    visited.add(name);
    const entry = lock.packages[`node_modules/${name}`];
    assert.ok(entry, `${name} is missing from package-lock.json`);
    queue.push(...Object.keys(entry.dependencies ?? {}));
  }
  return [...visited].sort();
}

test("web notice is deterministic and covers runtime plus emitted build code", async () => {
  await checkThirdPartyNotices();
  const notice = await generateThirdPartyNotices();
  const lockDigest = createHash("sha256")
    .update(lockSource)
    .digest("hex")
    .toUpperCase();

  assert.deepEqual(productionClosure(), ["react", "react-dom", "scheduler"]);
  assert.ok(notice.includes(`package-lock.json SHA-256: ${lockDigest}`));
  for (const name of productionClosure()) {
    assert.ok(
      DISTRIBUTED_WEB_PACKAGES.includes(name),
      `${name} runtime license is absent from the notice set`,
    );
  }
  for (const expected of [
    "react@19.2.6",
    "react-dom@19.2.6",
    "scheduler@0.27.0",
    "react-server-dom-webpack@19.2.6",
    "tailwindcss@4.2.1",
    "vinext@0.0.50",
    "rolldown@1.0.1",
    "vite@8.0.13",
    "Copyright (c) Meta Platforms, Inc. and affiliates.",
    "Copyright (c) Tailwind Labs, Inc.",
    "Copyright (c) 2026 Cloudflare, Inc.",
  ]) {
    assert.ok(notice.includes(expected), `${expected} is missing from notices`);
  }
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
