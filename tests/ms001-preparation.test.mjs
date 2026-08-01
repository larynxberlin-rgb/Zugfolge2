import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { parse } from "yaml";

const [
  register,
  schema,
  packageJson,
  kickoff,
  feature,
  contributing,
  milestonePlan,
] =
  await Promise.all([
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
    readFile(new URL("../package.json", import.meta.url), "utf8").then(
      JSON.parse,
    ),
    readFile(new URL("../planning/MS-001-KICKOFF.md", import.meta.url), "utf8"),
    readFile(
      new URL(
        "../spec/features/FEAT-0003-rights-license-and-source-clearance.md",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(new URL("../CONTRIBUTING.md", import.meta.url), "utf8"),
    readFile(
      new URL("../planning/milestones.yaml", import.meta.url),
      "utf8",
    ).then(parse),
  ]);

const ajv = new Ajv2020({
  allErrors: true,
  allowUnionTypes: true,
  strict: true,
});
addFormats(ajv);
const validate = ajv.compile(schema);
const today = new Date().toISOString().slice(0, 10);
const productionEligibleStatuses = new Set(
  register.statusRules.productionEligibleSourceStatuses,
);
const inactiveExpiredStatuses = new Set(["EXCLUDED", "REJECTED", "EXPIRED"]);

function assertCurrentReviewState(record, label) {
  if (record.reviewAfter < today) {
    assert.ok(
      inactiveExpiredStatuses.has(record.status),
      `${label} passed reviewAfter and must be EXPIRED, EXCLUDED, or REJECTED`,
    );
  }
  for (const [field, value] of [
    ["sourceValidTo", record.sourceValidTo],
    ["contractExpiresAt", record.contractExpiresAt],
  ]) {
    if (value && value < today) {
      assert.ok(
        inactiveExpiredStatuses.has(record.status),
        `${label} passed ${field} and must be EXPIRED, EXCLUDED, or REJECTED`,
      );
    }
  }
}

function assertSourcePolicy(source) {
  const permissions = Object.values(source.permissions);
  assertCurrentReviewState(source, source.id);

  if (productionEligibleStatuses.has(source.status)) {
    assert.ok(source.reviewedAt, `${source.id} approval needs a review date`);
    assert.ok(
      source.evidenceRefs.length > 0,
      `${source.id} approval needs safe evidence references`,
    );
    assert.ok(
      source.terms.archivedEvidenceRef,
      `${source.id} approval needs archived source terms`,
    );
    assert.ok(
      source.terms.archivedEvidenceDigestSha256,
      `${source.id} approval needs an archived-terms digest`,
    );
    assert.notEqual(
      source.privacyClass,
      "UNKNOWN",
      `${source.id} approval needs a privacy classification`,
    );
    assert.equal(
      permissions.includes("UNKNOWN"),
      false,
      `${source.id} approval cannot retain UNKNOWN permissions`,
    );
    if (source.status === "APPROVED") {
      assert.equal(
        permissions.includes("CONDITIONAL"),
        false,
        `${source.id} unconditional approval cannot retain CONDITIONAL permissions`,
      );
    }
  } else {
    assert.equal(
      permissions.includes("ALLOWED"),
      false,
      `${source.id} cannot assert ALLOWED before source approval`,
    );
  }
}

test("MS-001 rights register matches its schema", () => {
  assert.equal(
    validate(register),
    true,
    ajv.errorsText(validate.errors, { separator: "\n" }),
  );
});

test("owner license publication does not grant contribution, source, asset, or brand approval", () => {
  assert.equal(register.repositoryStatus, "LICENSED_REVIEW_PENDING");
  assert.equal(
    register.statusRules.approvalExpiryPolicy,
    "EVALUATE_AT_CI_RUN_DATE",
  );
  assert.equal(packageJson.private, true);
  assert.equal(packageJson.license, "AGPL-3.0-or-later");
  assert.equal(
    register.licensing.status,
    "OWNER_DECIDED_COUNSEL_PENDING",
  );
  assert.equal(register.licensing.ownerDecision.status, "RECORDED");
  assert.equal(register.licensing.publicationStatus, "ACTIVE");
  assert.equal(register.licensing.rootLicenseModel, "LICENSE_MOSAIC");
  assert.equal(
    register.licensing.firstLicensePublication.protocol,
    "TWO_COMMIT_PARENT_ATTESTATION_V1",
  );
  assert.equal(
    register.licensing.firstLicensePublication.state,
    "ATTESTED",
  );
  assert.equal(
    register.licensing.firstLicensePublication.grantCommit,
    "f8c3cb1c58b3034da8f70e0664c1d398849b9e39",
  );
  assert.equal(
    register.licensing.firstLicensePublication.attestedAt,
    "2026-08-01T05:30:24Z",
  );
  assert.equal(register.ownership.status, "HUMAN_REVIEW_REQUIRED");
  assert.equal(register.ownership.externalContributions, "CLOSED");
  assert.equal(register.ownership.selectedContributionModel, "CLA");
  assert.equal(
    register.ownership.contributionModelStatus,
    "OWNER_SELECTED_COUNSEL_PENDING",
  );
  assert.equal(register.ownership.claActivationStatus, "NOT_ACTIVE");
  assert.equal(register.ownership.aiAssistedWorkReview, "PENDING");
  assert.match(contributing, /external\s+contributions\s+are\s+closed/i);
  const components = new Map(
    register.licensing.components.map((component) => [
      component.id,
      component,
    ]),
  );
  assert.equal(
    components.get("game-code")?.selectedTreatment,
    "AGPL-3.0-or-later",
  );
  assert.equal(
    components.get("public-contracts-sdks")?.selectedTreatment,
    "Apache-2.0",
  );
  assert.equal(
    components.get("original-documentation")?.selectedTreatment,
    "CC-BY-4.0",
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
    register.licensing.components.every(
      (component) => component.status === "HUMAN_REVIEW_REQUIRED",
    ),
    true,
  );
  assert.equal(
    register.sources.some(({ status }) =>
      ["APPROVED", "APPROVED_WITH_CONDITIONS"].includes(status),
    ),
    false,
  );
  assert.equal(
    register.assets.some(({ provenanceStatus }) => provenanceStatus === "APPROVED"),
    false,
  );
  assert.equal(
    register.brands.some(({ status }) => status === "CLEARED"),
    false,
  );
});

test("rights records are unique, reviewable, and outside authoritative hot paths", () => {
  for (const [name, records] of Object.entries({
    brands: register.brands,
    assets: register.assets,
    sources: register.sources,
    services: register.services,
  })) {
    const ids = records.map(({ id }) => id);
    assert.equal(
      new Set(ids).size,
      ids.length,
      `${name} IDs must be unique`,
    );
  }

  assert.ok(register.sources.length >= 15);
  assert.ok(
    register.statusRules.requiredSnapshotFields.includes("fieldProvenance"),
  );
  assert.ok(
    register.statusRules.requiredSnapshotFields.includes("checksumSha256"),
  );
  const sourcesById = new Map(
    register.sources.map((source) => [source.id, source]),
  );
  for (const source of register.sources) {
    assert.equal(source.access.hotPath, false, `${source.id} must not be hot-path`);
    assert.ok(source.dataOwner, `${source.id} needs a data owner state`);
    assert.ok(source.contactRole, `${source.id} needs a contact role`);
    assert.ok(source.fieldScope.length > 0, `${source.id} needs field scope`);
    assert.ok(
      source.forbiddenUses.length > 0,
      `${source.id} needs forbidden uses`,
    );
    assert.ok(source.access.updateCadence, `${source.id} needs update cadence`);
    assert.ok(
      source.access.endpointOrLocator,
      `${source.id} needs an exact endpoint or locator state`,
    );
    assert.ok(
      source.sourceSchemaOrProfileVersion,
      `${source.id} needs a schema or profile version state`,
    );
    assert.ok(source.freshnessPolicy, `${source.id} needs a freshness policy`);
    assert.ok(source.retention, `${source.id} needs retention`);
    assert.ok(source.deletion, `${source.id} needs deletion behavior`);
    assert.ok(source.rollback, `${source.id} needs rollback behavior`);
    assert.ok(source.decisionOwnerRole, `${source.id} needs an accountable role`);
    assert.ok(source.nextAction, `${source.id} needs a next action`);
    assert.ok(source.failureBehavior, `${source.id} needs failure behavior`);
    assert.ok(source.fallback, `${source.id} needs a fallback`);
    assert.ok(source.withdrawal, `${source.id} needs withdrawal behavior`);
    assert.ok(
      source.reviewAfter >= register.statusAsOf,
      `${source.id} reviewAfter cannot predate the register`,
    );
    assertSourcePolicy(source);

    if (source.status === "SUBSTITUTED") {
      const substitute = sourcesById.get(source.substituteSourceId);
      assert.ok(substitute, `${source.id} substitute must exist`);
      assert.ok(
        register.statusRules.productionEligibleSourceStatuses.includes(
          substitute.status,
        ),
        `${source.id} substitute must be approved`,
      );
    }
  }
});

test("restricted railway and public map services are explicitly excluded", () => {
  const sources = new Map(register.sources.map((source) => [source.id, source]));
  const excluded = [
    "pathos-tpn",
    "trassenfinder",
    "public-osm-tiles",
    "public-orm-tiles",
    "public-nominatim",
  ];

  for (const sourceId of excluded) {
    const source = sources.get(sourceId);
    assert.ok(source, `${sourceId} must be registered`);
    assert.equal(source.status, "EXCLUDED");
    assert.equal(
      Object.values(source.permissions).every(
        (permission) =>
          permission === "PROHIBITED" || permission === "NOT_APPLICABLE",
      ),
      true,
      `${sourceId} must not accidentally authorize a use`,
    );
  }
  for (const source of register.sources.filter(
    ({ status }) => status === "EXCLUDED",
  )) {
    assert.equal(
      Object.values(source.permissions).every(
        (permission) =>
          permission === "PROHIBITED" || permission === "NOT_APPLICABLE",
      ),
      true,
      `${source.id} is excluded and cannot carry an operative permission`,
    );
  }

  assert.match(sources.get("trassenfinder").fallback, /own planner/i);
  assert.match(sources.get("public-osm-tiles").fallback, /self-hosted/i);
  assert.match(sources.get("public-orm-tiles").fallback, /own MapLibre/i);
});

test("OSM, synthetic data, and realistic disruptions retain separate gates", () => {
  const sources = new Map(register.sources.map((source) => [source.id, source]));
  const osm = sources.get("osm-pbf");
  const orm = sources.get("osm-railway-tagging");
  const synthetic = sources.get("synthetic-pilot");
  const realistic = sources.get("realistic-disruption-feeds");

  assert.equal(osm.status, "HUMAN_REVIEW_REQUIRED");
  assert.equal(osm.databaseClassification, "DERIVATIVE_REVIEW_REQUIRED");
  assert.equal(orm.category, "TAGGING_DOCUMENTATION");
  assert.equal(synthetic.databaseClassification, "ORIGINAL");
  assert.match(synthetic.currentDecision, /development/i);

  assert.equal(realistic.status, "CONTRACT_REQUIRED");
  assert.equal(realistic.requiredByRelease, "RG-5");
  assert.ok(realistic.consumerMilestones.includes("MS-039"));
  assert.match(realistic.fallback, /SIMULATED or MANUAL/);
  assert.match(realistic.failureBehavior, /never silently switch/i);
});

test("registered asset checksums match tracked bytes", async () => {
  for (const asset of register.assets) {
    const bytes = await readFile(new URL(`../${asset.path}`, import.meta.url));
    const digest = createHash("sha256").update(bytes).digest("hex").toUpperCase();
    assert.equal(digest, asset.sha256, `${asset.id} checksum drift`);
  }
});

test("current external demo hosting is disclosed and production-limited", () => {
  const services = new Map(
    register.services.map((service) => [service.id, service]),
  );
  const demo = services.get("connected-demo-hosting");
  const map = services.get("self-hosted-map-stack");

  assert.equal(demo.hostingModel, "EXTERNAL_DEMO");
  assert.equal(demo.status, "DEVELOPMENT_ONLY");
  assert.equal(demo.removable, true);
  assert.match(demo.productionUse, /Not approved/i);
  assert.equal(demo.firstConsumerMilestone, "MS-000");
  assert.equal(map.hostingModel, "SELF_HOSTED");
  assert.equal(map.firstConsumerMilestone, "MS-022");
  assert.ok(services.has("external-payment-provider"));
  assert.ok(services.has("external-notification-provider"));
  assert.ok(services.has("self-hosted-observability"));

  for (const service of services.values()) {
    assert.ok(service.provider, `${service.id} needs a provider state`);
    assert.ok(service.ownerRole, `${service.id} needs an owner role`);
    assert.ok(service.dataProcessingRole, `${service.id} needs a processing role`);
    assert.ok(service.retention, `${service.id} needs retention`);
    assert.ok(service.deletion, `${service.id} needs deletion behavior`);
    assert.ok(service.removalPath, `${service.id} needs a removal path`);
    assert.match(
      service.firstConsumerMilestone,
      /^MS-\d{3}$/,
      `${service.id} needs its first consuming milestone`,
    );
    assert.ok(
      service.reviewAfter >= register.statusAsOf,
      `${service.id} reviewAfter cannot predate the register`,
    );
    assertCurrentReviewState(service, service.id);
    if (service.status === "APPROVED") {
      assert.ok(service.reviewedAt, `${service.id} approval needs a review date`);
      assert.ok(
        service.evidenceRefs.length > 0,
        `${service.id} approval needs safe evidence references`,
      );
    }
  }
});

test("brand, asset, and private-evidence records preserve accountable human gates", () => {
  for (const brand of register.brands) {
    assert.ok(brand.searchScope, `${brand.id} needs a search scope`);
    assert.ok(brand.intendedTerritories.length > 0);
    assert.ok(brand.intendedClasses.length > 0);
    assert.ok(brand.reviewerRole, `${brand.id} needs a reviewer role`);
    assert.ok(brand.fallback, `${brand.id} needs a fallback`);
    assert.ok(brand.renewalOwnerRole, `${brand.id} needs a renewal owner`);
    assert.ok(brand.reviewAfter >= today, `${brand.id} review is stale`);
  }
  for (const asset of register.assets) {
    assert.ok(asset.reviewerRole, `${asset.id} needs a reviewer role`);
    assert.equal(asset.reviewDecision, "NOT_REVIEWED");
    assert.equal(asset.reviewedAt, null);
    assert.deepEqual(asset.evidenceRefs, []);
  }

  const invalidEvidence = structuredClone(register);
  invalidEvidence.ownership.evidenceRefs = [
    {
      id: "private://ownership/decision-1",
      documentRole: "OWNERSHIP",
      decisionDate: register.statusAsOf,
      reviewerRole: "RIGHTS_HOLDER",
    },
  ];
  assert.equal(
    validate(invalidEvidence),
    false,
    "private evidence without a SHA-256 digest must fail schema validation",
  );
});

test("RG-0 through RG-4 coverage maps every milestone, required source, and service", () => {
  const targetReleases = new Set(["RG-0", "RG-1", "RG-2", "RG-3", "RG-4"]);
  const coverageByRelease = new Map(
    register.releaseCoverage.map((coverage) => [coverage.release, coverage]),
  );
  assert.deepEqual(new Set(coverageByRelease.keys()), targetReleases);

  const coveredMilestones = register.releaseCoverage.flatMap(
    ({ milestones }) => milestones,
  );
  assert.equal(
    new Set(coveredMilestones).size,
    coveredMilestones.length,
    "a milestone must occur in exactly one release coverage record",
  );
  const plannedMilestones = milestonePlan.milestones
    .filter(({ release }) => targetReleases.has(release))
    .map(({ id }) => id)
    .sort();
  assert.deepEqual(coveredMilestones.toSorted(), plannedMilestones);

  const sourceIds = new Set(register.sources.map(({ id }) => id));
  const serviceIds = new Set(register.services.map(({ id }) => id));
  const coveredSourceIds = new Set(
    register.releaseCoverage.flatMap(({ sourceIds: ids }) => ids),
  );
  const coveredServiceIds = new Set(
    register.releaseCoverage.flatMap(({ serviceIds: ids }) => ids),
  );

  for (const coverage of register.releaseCoverage) {
    assert.equal(coverage.status, "PREPARATION_INCOMPLETE");
    assert.ok(coverage.openGaps.length > 0);
    for (const sourceId of coverage.sourceIds) {
      assert.ok(sourceIds.has(sourceId), `${sourceId} coverage source must exist`);
    }
    for (const serviceId of coverage.serviceIds) {
      assert.ok(
        serviceIds.has(serviceId),
        `${serviceId} coverage service must exist`,
      );
    }
  }

  for (const source of register.sources.filter(({ requiredByRelease }) =>
    targetReleases.has(requiredByRelease),
  )) {
    assert.ok(
      coveredSourceIds.has(source.id),
      `${source.id} required through RG-4 needs coverage`,
    );
  }
  for (const service of register.services) {
    assert.ok(
      coveredServiceIds.has(service.id),
      `${service.id} needs release coverage`,
    );
  }
});

test("schema and policy reject premature, contradictory, or expired approvals", () => {
  const premature = structuredClone(register);
  premature.sources.find(({ id }) => id === "synthetic-pilot").permissions.storage =
    "ALLOWED";
  assert.equal(
    validate(premature),
    false,
    "a non-approved source cannot claim an ALLOWED permission",
  );

  const contradictory = structuredClone(register);
  contradictory.sources.find(
    ({ id }) => id === "public-osm-tiles",
  ).permissions.storage = "ALLOWED";
  assert.equal(
    validate(contradictory),
    false,
    "an excluded source cannot claim an ALLOWED permission",
  );

  const unresolvedApproval = structuredClone(register);
  unresolvedApproval.sources.find(
    ({ id }) => id === "synthetic-pilot",
  ).status = "APPROVED";
  assert.equal(
    validate(unresolvedApproval),
    false,
    "approval with UNKNOWN permissions and no approval evidence must fail",
  );

  const staleReview = structuredClone(
    register.sources.find(({ id }) => id === "synthetic-pilot"),
  );
  staleReview.reviewAfter = "2000-01-01";
  assert.throws(() => assertSourcePolicy(staleReview), /passed reviewAfter/);

  const expiredContract = structuredClone(staleReview);
  expiredContract.reviewAfter = "2999-01-01";
  expiredContract.contractExpiresAt = "2000-01-01";
  assert.throws(() => assertSourcePolicy(expiredContract), /contractExpiresAt/);
});

test("the kickoff is eight bounded slices and preserves all human gates", () => {
  for (let index = 1; index <= 8; index += 1) {
    assert.match(
      kickoff,
      new RegExp(`## S0${index} —`),
      `S0${index} must be documented`,
    );
  }
  for (let issueNumber = 12; issueNumber <= 20; issueNumber += 1) {
    assert.match(
      kickoff,
      new RegExp(`Zugfolge/issues/${issueNumber}`),
      `GitHub issue #${issueNumber} must be mapped`,
    );
  }
  assert.match(kickoff, /integrated current `main`/i);
  assert.match(kickoff, /qualified\s+software-license counsel/i);
  assert.match(kickoff, /trademark counsel/i);
  assert.match(kickoff, /privacy/i);
  assert.match(kickoff, /independent/i);
  assert.doesNotMatch(kickoff, /<[^>\n]+>/);
  assert.match(kickoff, /node tools\/run-supply-chain\.mjs/);
  assert.match(kickoff, /gitleaks git --config=\.gitleaks\.toml/);
  assert.match(feature, /\*\*Status:\*\* Proposed/);
  assert.match(feature, /RIGHTS-001/);
  assert.match(feature, /RIGHTS-010/);
  assert.match(feature, /AC-010/);
});
