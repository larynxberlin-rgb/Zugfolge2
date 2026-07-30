import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Zugfolge operations console", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html lang="de"/i);
  assert.match(html, /Live-Lage \| Zugfolge/i);
  assert.match(html, /ZUGFOLGE/);
  assert.match(html, /Mitteldeutschland 2026/);
  assert.match(html, /SPFV/);
  assert.match(html, /SGV/);
  assert.match(html, /SPNV/);
  assert.match(html, /Simuliert/);
  assert.match(html, /OpenStreetMap/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});

test("ships the Block-Z brand and reduced-motion fallback", async () => {
  const [blockZ, css, manifest, packageJson] = await Promise.all([
    readFile(new URL("../app/components/BlockZ.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(blockZ, /block-z__segment--top/);
  assert.match(blockZ, /block-z__segment--diagonal/);
  assert.match(blockZ, /block-z__segment--bottom/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /#0b1016/i);
  assert.match(css, /#39c6e5/i);
  assert.match(manifest, /"name":\s*"Zugfolge"/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
});
