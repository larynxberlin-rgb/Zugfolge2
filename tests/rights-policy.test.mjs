import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { parse } from "yaml";

const REPOSITORY_ROOT = new URL("../", import.meta.url);
const FIRST_LICENSED_COMMIT =
  "f8c3cb1c58b3034da8f70e0664c1d398849b9e39";
const ATTESTATION_PATHS = [
  "compliance/rights-register.yaml",
  "docs/legal/LICENSE-DECISION.md",
  "tests/ms001-preparation.test.mjs",
  "tests/rights-policy.test.mjs",
];
const [register, schema, reuse, pendingLicense] = await Promise.all([
  readFile(
    new URL("../compliance/rights-register.yaml", import.meta.url),
    "utf8",
  ).then(parse),
  readFile(
    new URL(
      "../compliance/schemas/rights-register.schema.json",
      import.meta.url,
    ),
    "utf8",
  ).then(JSON.parse),
  readFile(new URL("../REUSE.toml", import.meta.url), "utf8"),
  readFile(
    new URL(
      "../LICENSES/LicenseRef-Zugfolge-Provenance-Pending.txt",
      import.meta.url,
    ),
    "utf8",
  ),
]);

const ajv = new Ajv2020({
  allErrors: true,
  allowUnionTypes: true,
  strict: true,
});
addFormats(ajv);
const validate = ajv.compile(schema);

function assertRejected(mutator, label) {
  const candidate = structuredClone(register);
  mutator(candidate);
  assert.equal(validate(candidate), false, label);
}

function git(args) {
  return execFileSync("git", args, {
    cwd: REPOSITORY_ROOT,
    encoding: "utf8",
  }).trim();
}

function hasGitObject(object) {
  try {
    execFileSync("git", ["cat-file", "-e", object], {
      cwd: REPOSITORY_ROOT,
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

function parseReuseAnnotations(source) {
  return source
    .split("[[annotations]]")
    .slice(1)
    .map((block) => {
      const pathValue = block.match(
        /path\s*=\s*(\[[\s\S]*?\]|"[^"]+")\s*\nprecedence/,
      )?.[1];
      const license = block.match(
        /SPDX-License-Identifier\s*=\s*"([^"]+)"/,
      )?.[1];
      assert.ok(pathValue, "every REUSE annotation needs a path");
      assert.ok(license, "every REUSE annotation needs a license identifier");
      return {
        paths: [...pathValue.matchAll(/"([^"]+)"/g)].map((match) => match[1]),
        license,
      };
    });
}

function globMatches(pattern, path) {
  const tokens = pattern
    .replaceAll("\\", "/")
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replaceAll("**", "\u0000")
    .replaceAll("*", "[^/]*")
    .replaceAll("\u0000", ".*");
  return new RegExp(`^${tokens}$`).test(path);
}

function isReuseIgnored(path) {
  if (path === "REUSE.toml" || path.startsWith("LICENSES/")) return true;
  const name = path.split("/").at(-1);
  return /^(?:COPYING|LICENSE|LICENCE)(?:[.-].*)?$/.test(name);
}

test("owner publication and open review are separate machine states", () => {
  assert.equal(validate(register), true, ajv.errorsText(validate.errors));
  assert.equal(register.repositoryStatus, "LICENSED_REVIEW_PENDING");
  assert.equal(register.ownership.status, "HUMAN_REVIEW_REQUIRED");
  assert.equal(register.ownership.externalContributions, "CLOSED");
  assert.equal(register.ownership.selectedContributionModel, "CLA");
  assert.equal(
    register.ownership.contributionModelStatus,
    "OWNER_SELECTED_COUNSEL_PENDING",
  );
  assert.equal(register.ownership.claActivationStatus, "NOT_ACTIVE");
  assert.equal(register.ownership.aiAssistedWorkReview, "PENDING");
  assert.equal(
    register.licensing.status,
    "OWNER_DECIDED_COUNSEL_PENDING",
  );
  assert.equal(register.licensing.ownerDecision.status, "RECORDED");
  assert.equal(register.licensing.publicationStatus, "ACTIVE");
  assert.equal(register.licensing.rootLicenseModel, "LICENSE_MOSAIC");
  assert.equal(
    register.licensing.firstLicensePublication.state,
    "ATTESTED",
  );
  assert.equal(
    register.licensing.firstLicensePublication.grantCommit,
    FIRST_LICENSED_COMMIT,
  );
  assert.equal(
    register.licensing.firstLicensePublication.attestedAt,
    "2026-08-01T05:30:24Z",
  );

  const ids = register.licensing.components.map(({ id }) => id);
  assert.equal(new Set(ids).size, ids.length);
  const components = new Map(
    register.licensing.components.map((component) => [
      component.id,
      component,
    ]),
  );
  assert.equal(
    components.get("synthetic-fixtures")?.publicationStatus,
    "EXCLUDED_FROM_LICENSE_GRANT",
  );
  assert.equal(
    components.get("osm-derived-database")?.publicationStatus,
    "POLICY_ONLY_NO_ARTIFACT",
  );
  assert.equal(
    components.get("brand-premium-media")?.publicationStatus,
    "RIGHTS_RESERVATION_ACTIVE",
  );

  assert.equal(
    register.sources.some(({ status }) =>
      ["APPROVED", "APPROVED_WITH_CONDITIONS"].includes(status),
    ),
    false,
  );
  assert.equal(
    register.assets.some(({ provenanceStatus }) =>
      provenanceStatus.startsWith("APPROVED"),
    ),
    false,
  );
  assert.equal(
    register.brands.some(({ status }) => status === "CLEARED"),
    false,
  );
  assert.match(
    pendingLicense,
    /evaluation-only[\s\S]*not eligible for\s+public deployment or distribution/i,
  );
  assert.match(
    reuse,
    /must not be publicly deployed or distributed until the file is approved, replaced, or excluded/,
  );
});

test("first licensed commit is attested by its immediate child", (context) => {
  if (!hasGitObject(`${FIRST_LICENSED_COMMIT}^{commit}`)) {
    context.skip("grant commit is unavailable in this shallow checkout");
    return;
  }

  const attestationCommit = git([
    "log",
    "-S",
    "state: ATTESTED",
    "--format=%H",
    "--",
    "compliance/rights-register.yaml",
  ])
    .split(/\r?\n/)
    .filter(Boolean)
    .at(-1);
  assert.ok(attestationCommit, "attestation commit is absent from Git history");
  assert.equal(
    git(["rev-parse", `${attestationCommit}^`]),
    FIRST_LICENSED_COMMIT,
    "the attestation commit must be the immediate child of the grant commit",
  );

  const pendingRegister = git([
    "show",
    `${FIRST_LICENSED_COMMIT}:compliance/rights-register.yaml`,
  ]);
  assert.match(pendingRegister, /state: PENDING_ATTESTATION/);
  assert.match(pendingRegister, /grantCommit: null/);
  assert.match(pendingRegister, /attestedAt: null/);
  for (const path of ["LICENSE", "REUSE.toml", "LICENSES/AGPL-3.0-or-later.txt"]) {
    assert.equal(
      hasGitObject(`${FIRST_LICENSED_COMMIT}:${path}`),
      true,
      `${path} is absent from the first licensed commit`,
    );
  }

  const changedPaths = git([
    "diff-tree",
    "--no-commit-id",
    "--name-only",
    "-r",
    attestationCommit,
  ])
    .split(/\r?\n/)
    .filter(Boolean)
    .sort();
  assert.deepEqual(changedPaths, [...ATTESTATION_PATHS].sort());
});

test("schema rejects license publication states that imply unearned approval", () => {
  assertRejected(
    (candidate) => {
      candidate.ownership.claActivationStatus = "ACTIVE";
    },
    "a closed CLA contribution path cannot be active",
  );
  assertRejected(
    (candidate) => {
      candidate.ownership.externalContributions = "PERMITTED_CLA";
    },
    "CLA contributions require an active contribution model and CLA",
  );
  assertRejected(
    (candidate) => {
      candidate.licensing.rootLicenseModel = "UNLICENSED";
    },
    "an active reviewed-pending publication cannot claim to be unlicensed",
  );
  assertRejected(
    (candidate) => {
      candidate.licensing.ownerDecision.status = "NOT_RECORDED";
    },
    "active publication requires a recorded owner decision",
  );
  assertRejected(
    (candidate) => {
      candidate.ownership.status = "APPROVED";
    },
    "owner publication does not approve the rights chain",
  );
  assertRejected(
    (candidate) => {
      candidate.licensing.components.find(
        ({ id }) => id === "synthetic-fixtures",
      ).publicationStatus = "ACTIVE";
    },
    "a provenance-pending fixture cannot receive an active grant",
  );
  assertRejected(
    (candidate) => {
      candidate.licensing.components.find(
        ({ id }) => id === "osm-derived-database",
      ).publicationStatus = "ACTIVE";
    },
    "ODbL remains policy-only while no approved database artifact exists",
  );
});

test("every covered repository file has one effective REUSE classification", async () => {
  const annotations = parseReuseAnnotations(reuse);
  const files = execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
    {
      cwd: REPOSITORY_ROOT,
      encoding: "utf8",
    },
  )
    .split("\0")
    .filter(Boolean)
    .map((path) => path.replaceAll("\\", "/"))
    .filter((path) => !isReuseIgnored(path));

  const unclassified = [];
  const unexpectedOverlaps = [];
  const effective = new Map();
  const allowedOverrides = new Set([
    "app/components/BlockZ.tsx",
    "app/lib/pilot-data.ts",
    "public/favicon.svg",
    "public/og.png",
    "public/legal/THIRD-PARTY-NOTICES.txt",
  ]);

  for (const path of files) {
    const matches = annotations.filter((annotation) =>
      annotation.paths.some((pattern) => globMatches(pattern, path)),
    );
    if (matches.length === 0) {
      unclassified.push(path);
      continue;
    }
    if (matches.length > 1 && !allowedOverrides.has(path)) {
      unexpectedOverlaps.push(path);
    }
    effective.set(path, matches.at(-1).license);
  }

  assert.deepEqual(unclassified, [], `unclassified files: ${unclassified}`);
  assert.deepEqual(
    unexpectedOverlaps,
    [],
    `unexpected overlapping classifications: ${unexpectedOverlaps}`,
  );

  assert.equal(effective.get("package.json"), "AGPL-3.0-or-later");
  assert.equal(effective.get("README.md"), "CC-BY-4.0");
  assert.equal(
    effective.get("packages/contracts/openapi/openapi.yaml"),
    "Apache-2.0",
  );
  for (const path of [
    "app/components/BlockZ.tsx",
    "app/lib/pilot-data.ts",
    "public/favicon.svg",
    "public/og.png",
  ]) {
    assert.equal(
      effective.get(path),
      "LicenseRef-Zugfolge-Provenance-Pending",
    );
  }
  assert.equal(
    effective.get("public/legal/THIRD-PARTY-NOTICES.txt"),
    "LicenseRef-Third-Party-Notices",
  );
  assert.equal(
    [...effective.values()].includes("ODbL-1.0"),
    false,
    "no current repository artifact is an approved ODbL database",
  );

  const usedLicenseIds = new Set(effective.values());
  const licenseFiles = new Set(
    (await readdir(new URL("../LICENSES/", import.meta.url)))
      .filter((name) => name.endsWith(".txt"))
      .map((name) => name.slice(0, -4)),
  );
  assert.deepEqual(
    [...licenseFiles].sort(),
    [...usedLicenseIds].sort(),
    "LICENSES must contain exactly the licenses used by covered files",
  );
});
