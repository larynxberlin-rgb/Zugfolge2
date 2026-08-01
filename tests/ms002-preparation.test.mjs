import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8").then((content) =>
    content.replaceAll("\r\n", "\n"),
  );

test("MS-002 records human security approval before implementation", async () => {
  const [milestones, feature, adr, kickoff, dependencies, development] =
    await Promise.all([
      read("planning/milestones.yaml"),
      read("spec/features/FEAT-0002-reproducible-polyglot-baseline.md"),
      read("spec/adr/ADR-0005-polyglot-build-and-supply-chain-policy.md"),
      read("planning/MS-002-KICKOFF.md"),
      read("docs/DEPENDENCIES.md"),
      read("docs/DEVELOPMENT.md"),
    ]);

  const milestone = milestones.match(
    / {2}- id: MS-002\n(?<body>[\s\S]*?)(?=\n {2}- id: MS-003\n)/,
  );
  assert.ok(milestone, "MS-002 must remain in the machine-readable roadmap");
  assert.match(milestone.groups.body, /status: in-progress/);
  assert.match(
    milestone.groups.body,
    /Security reviewer approves new CI permissions and dependency policy/,
  );

  assert.match(feature, /\*\*Status:\*\* Accepted/);
  assert.match(adr, /\*\*Status:\*\* Accepted/);
  assert.match(kickoff, /human security approval recorded/);
  assert.match(kickoff, /repository owner explicitly assumed and approved/);
  assert.match(dependencies, /\*\*Security approval:\*\* accepted/);
  assert.match(development, /accepted MS-002 target/);
  assert.doesNotMatch(
    `${feature}\n${adr}\n${kickoff}\n${dependencies}\n${development}`,
    /awaiting human security approval|Decisions still blocking implementation|remains `Proposed`/,
  );
});

test("MS-002 is split into exactly eight bounded slices", async () => {
  const kickoff = await read("planning/MS-002-KICKOFF.md");
  const ids = [
    ...kickoff.matchAll(/^### (MS-002-S\d{2}) — /gm),
  ].map((match) => match[1]);
  const slices = [
    ...kickoff.matchAll(
      /^### MS-002-S\d{2} — [\s\S]*?(?=^### MS-002-S\d{2} — |^## Human preparation gate)/gm,
    ),
  ].map((match) => match[0]);

  assert.deepEqual(
    ids,
    Array.from({ length: 8 }, (_, index) =>
      `MS-002-S${String(index + 1).padStart(2, "0")}`),
  );

  for (const required of [
    "**Risk:**",
    "**Allowed paths:**",
    "**Forbidden:**",
    "**Acceptance:**",
    "**Rollback:**",
    "**Observability:**",
    "**Verification:**",
  ]) {
    for (const slice of slices) {
      assert.match(slice, new RegExp(required.replaceAll("*", "\\*")));
    }
  }

  const expectedDependencies = [
    null,
    "S01.",
    "S01.",
    "S01.",
    "S02, S03, S04.",
    "S05 and recorded human security approval.",
    "S06.",
    "S07.",
  ];

  slices.forEach((slice, index) => {
    const allowed = slice.match(
      /- \*\*Allowed paths:\*\* (?<body>[\s\S]*?)(?=\n- \*\*Forbidden:\*\*)/,
    );
    const verification = slice.match(
      /- \*\*Verification:\*\* (?<body>[\s\S]*?)(?=\n\n|\n###|\n##)/,
    );

    assert.ok(allowed, `${ids[index]} must declare an exact path allowlist`);
    assert.ok(
      verification,
      `${ids[index]} must declare executable verification`,
    );
    assert.doesNotMatch(
      allowed.groups.body,
      /\*\*|`[^/][^`]*\/\*\*|existing .*configs|relevant sections|under `tools/,
    );
    assert.ok(
      [...allowed.groups.body.matchAll(/`([^`]+)`/g)].every((match) =>
        match[1].startsWith("/"),
      ),
      `${ids[index]} contains a non-rooted allowed path`,
    );
    assert.ok(
      [...verification.groups.body.matchAll(/`([^`]+)`/g)].length >= 2,
      `${ids[index]} needs at least two literal verification commands/evidence targets`,
    );

    if (expectedDependencies[index] === null) {
      assert.doesNotMatch(slice, /- \*\*Depends on:\*\*/);
    } else {
      assert.match(
        slice,
        new RegExp(
          `- \\*\\*Depends on:\\*\\* ${expectedDependencies[index].replaceAll(
            ".",
            "\\.",
          )}`,
        ),
      );
    }
  });
});

test("the accepted baseline stays service-free and records exact cross-platform evidence", async () => {
  const [feature, adr, dependencies, development, kickoff, docsIndex] =
    await Promise.all([
      read("spec/features/FEAT-0002-reproducible-polyglot-baseline.md"),
      read("spec/adr/ADR-0005-polyglot-build-and-supply-chain-policy.md"),
      read("docs/DEPENDENCIES.md"),
      read("docs/DEVELOPMENT.md"),
      read("planning/MS-002-KICKOFF.md"),
      read("docs/README.md"),
    ]);

  assert.match(feature, /PostgreSQL, NATS,[\s\S]*Kubernetes/);
  assert.match(feature, /Introducing any of these in `MS-002` is a scope violation/);
  assert.match(adr, /Gradle wrapper `9\.5\.0`/);
  assert.match(adr, /Kotlin JVM plugin `2\.4\.10`/);
  assert.match(adr, /Node\.js `24\.18\.0` LTS/);
  assert.match(adr, /pnpm `11\.18\.0`/);
  assert.match(adr, /Gitleaks `8\.30\.1`/);
  assert.match(adr, /coverage\.py` `7\.15\.2`/);
  assert.match(adr, /JaCoCo `0\.8\.15`/);
  assert.match(adr, /retained for 30 days/);
  assert.doesNotMatch(adr, /use Gradle `9\.6\.1` immediately[\s\S]*Accepted/);
  assert.match(dependencies, /Eclipse Temurin \| `21\.0\.12\+8`/);
  assert.match(dependencies, /CPython \| `3\.13\.14`/);
  assert.match(dependencies, /python-31314/);
  for (const digest of [
    "55aa7153f9d88f28d765fcdad5ae6945b5c0f98a36881703817e4c450fa76742",
    "c54d9b9bbb8a36e6489363ddd01139707fd781d72f1f9e90c7ec65d0061368e0",
    "e4446ff06a276155697597cc0f1b15da004ff083f4964a35271ecee567177370",
    "9ba963ee2371874a74185d18bc7bb2ab9407df7683300855ed7606e0662321d0",
    "eaf842262aa1c418d8ecc5605f02ee1ebfd369124fa48548e85f9481a47831a9",
    "d29144deff3a68aa93ced33dddf84b7fdc26070add4aa0f4513094c8332afc4e",
  ]) {
    assert.match(dependencies, new RegExp(digest));
  }
  for (const actionSha of [
    "3d3c42e5aac5ba805825da76410c181273ba90b1",
    "0ebf47130e4866e96fce0953f49152a61190b271",
    "c771a70e6277c0a99b617c7a806ffedaca235ff9",
    "f205ea1c3313d32999d8d6a48b4f6530d4437b38",
  ]) {
    assert.match(dependencies, new RegExp(actionSha));
  }
  assert.match(dependencies, /sha_pinning_required: false/);
  assert.match(dependencies, /before S06 is accepted/);
  assert.match(dependencies, /MUST NOT enable auto-merge/);
  assert.match(dependencies, /No cross-ecosystem CycloneDX CLI is\napproved/);
  assert.match(dependencies, /one Low and eight High findings/);
  assert.match(dependencies, /react-server-dom-webpack` `19\.2\.8`/);
  assert.match(dependencies, /Vite `8\.2\.0`/);
  assert.match(dependencies, /@cloudflare\/vite-plugin` `1\.50\.0`/);
  assert.match(dependencies, /S02 MUST resolve the High findings/);
  assert.match(dependencies, /MUST NOT use `npm audit fix --force`/);
  assert.doesNotMatch(
    `${adr}\n${dependencies}\n${kickoff}`,
    /\| (?:Python runtime \| CPython|CPython|Python) \|? `3\.12\.13`/,
  );
  assert.match(development, /uv sync --all-packages --locked/);
  assert.match(development, /Gradle MUST NOT use or ignore the tracked `\/build`/);

  const jvmSlice = kickoff.match(
    /^### MS-002-S04 — [\s\S]*?(?=^### MS-002-S05 — )/m,
  );
  assert.ok(jvmSlice);
  assert.match(jvmSlice[0], /\/tools\/verify-gradle-wrapper\.mjs/);
  assert.match(jvmSlice[0], /node tools\/verify-gradle-wrapper\.mjs/);
  assert.doesNotMatch(jvmSlice[0], /coverage/i);

  const jvmVerification = jvmSlice[0].match(
    /- \*\*Verification:\*\* (?<body>[\s\S]*?)$/,
  );
  assert.ok(jvmVerification);
  assert.ok(
    jvmVerification.groups.body.indexOf(
      "node tools/verify-gradle-wrapper.mjs",
    ) <
      jvmVerification.groups.body.indexOf(
        "./gradlew --no-daemon --console=plain check",
      ),
    "wrapper JAR verification must precede wrapper execution",
  );

  assert.match(kickoff, /S02–S08 remain governed by their own dependencies/);
  assert.match(docsIndex, /Abhängigkeits- und Supply-Chain-Register/);
  assert.doesNotMatch(docsIndex, /Ã|â€”/);
});
