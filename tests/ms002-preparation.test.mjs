import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8").then((content) =>
    content.replaceAll("\r\n", "\n"),
  );

test("MS-002 preparation remains blocked on its human security gate", async () => {
  const [milestones, feature, adr, kickoff] = await Promise.all([
    read("planning/milestones.yaml"),
    read("spec/features/FEAT-0002-reproducible-polyglot-baseline.md"),
    read("spec/adr/ADR-0005-polyglot-build-and-supply-chain-policy.md"),
    read("planning/MS-002-KICKOFF.md"),
  ]);

  const milestone = milestones.match(
    / {2}- id: MS-002\n(?<body>[\s\S]*?)(?=\n {2}- id: MS-003\n)/,
  );
  assert.ok(milestone, "MS-002 must remain in the machine-readable roadmap");
  assert.match(milestone.groups.body, /status: ready/);
  assert.match(
    milestone.groups.body,
    /Security reviewer approves new CI permissions and dependency policy/,
  );

  assert.match(feature, /\*\*Status:\*\* Proposed/);
  assert.match(adr, /\*\*Status:\*\* Proposed/);
  assert.match(kickoff, /awaiting human security approval/);
  assert.match(kickoff, /AI agent or implementation test cannot substitute/);
  assert.doesNotMatch(kickoff, /Preparation status:\*\* approved/);
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

test("the proposed baseline stays service-free and records reviewable cross-platform candidates", async () => {
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

  assert.match(
    kickoff,
    /blocks completion of\nS01 as well as the start of S02–S08/,
  );
  assert.match(docsIndex, /Abhängigkeits- und Supply-Chain-Register/);
  assert.doesNotMatch(docsIndex, /Ã|â€”/);
});
