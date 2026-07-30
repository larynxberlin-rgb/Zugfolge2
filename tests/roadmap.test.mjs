import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";
import { parse } from "yaml";

const roadmap = await readFile(
  new URL("../planning/milestones.yaml", import.meta.url),
  "utf8",
).then(parse);
const humanRoadmap = await readFile(
  new URL("../docs/ROADMAP.md", import.meta.url),
  "utf8",
);
const evidenceTemplate = await readFile(
  new URL("../planning/EVIDENCE_TEMPLATE.yaml", import.meta.url),
  "utf8",
).then(parse);
const evidenceFiles = await readdir(
  new URL("../planning/evidence/", import.meta.url),
);
const milestoneEvidence = new Map(
  await Promise.all(
    evidenceFiles
      .filter((fileName) => /^MS-\d{3}\.yaml$/.test(fileName))
      .map(async (fileName) => {
        const evidence = await readFile(
          new URL(`../planning/evidence/${fileName}`, import.meta.url),
          "utf8",
        ).then(parse);
        return [evidence.milestoneId, evidence];
      }),
  ),
);

test("delivery roadmap has one valid, dependency-safe source of truth", () => {
  assert.equal(roadmap.schemaVersion, 1);
  assert.match(roadmap.statusAsOf, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(Array.isArray(roadmap.releases));
  assert.ok(Array.isArray(roadmap.milestones));

  const releases = new Map(roadmap.releases.map((release) => [release.id, release]));
  const milestones = new Map(
    roadmap.milestones.map((milestone) => [milestone.id, milestone]),
  );

  assert.equal(releases.size, roadmap.releases.length, "release IDs must be unique");
  assert.equal(
    milestones.size,
    roadmap.milestones.length,
    "milestone IDs must be unique",
  );
  assert.ok(milestones.has(roadmap.fullReleaseMilestone));

  const releaseOrder = new Map(
    roadmap.releases.map((release, index) => [release.id, index]),
  );
  const allowedStatuses = new Set([
    "planned",
    "ready",
    "in-progress",
    "verifying",
    "completed",
    "blocked",
  ]);

  for (const release of roadmap.releases) {
    assert.match(release.id, /^RG-\d+$/);
    assert.ok(release.title);
    assert.ok(release.outcome);
    assert.ok(release.exitCriteria.length >= 2);
    assert.equal(
      new Set(release.dependsOnMilestones).size,
      release.dependsOnMilestones.length,
      `${release.id} must not repeat milestones`,
    );

    const assigned = roadmap.milestones
      .filter((milestone) => milestone.release === release.id)
      .map((milestone) => milestone.id)
      .sort();
    assert.deepEqual(
      [...release.dependsOnMilestones].sort(),
      assigned,
      `${release.id} must list every assigned milestone exactly once`,
    );

    const heading = `### ${release.id} — ${release.title}`;
    const sectionStart = humanRoadmap.indexOf(heading);
    assert.notEqual(sectionStart, -1, `${release.id} heading must stay current`);
    const nextSectionStart = humanRoadmap.indexOf("\n### RG-", sectionStart + 1);
    const section = humanRoadmap.slice(
      sectionStart,
      nextSectionStart === -1 ? undefined : nextSectionStart,
    );
    for (const milestoneId of assigned) {
      assert.ok(
        section.includes(`\`${milestoneId}\``),
        `${milestoneId} must remain in the ${release.id} section`,
      );
    }
  }

  for (const milestone of roadmap.milestones) {
    assert.match(milestone.id, /^MS-\d{3}$/);
    assert.ok(releases.has(milestone.release), `${milestone.id} release must exist`);
    assert.ok(allowedStatuses.has(milestone.status));
    assert.match(milestone.risk, /^R[0-3]$/);
    assert.match(milestone.effort, /^[SML]$/);
    assert.ok(milestone.title);
    assert.ok(milestone.outcome);
    assert.ok(milestone.scope.length >= 2);
    assert.ok(milestone.exitCriteria.length >= 2);
    assert.ok(milestone.verification.length >= 2);
    assert.ok(milestone.humanGate.length >= 1);
    assert.ok(
      humanRoadmap.includes(
        `| \`${milestone.id}\` | ${milestone.title} | ${milestone.status} |`,
      ),
      `${milestone.id} title and status must match the human roadmap`,
    );
    assert.equal(
      new Set(milestone.dependsOn).size,
      milestone.dependsOn.length,
      `${milestone.id} must not repeat dependencies`,
    );

    for (const dependencyId of milestone.dependsOn) {
      const dependency = milestones.get(dependencyId);
      assert.ok(dependency, `${milestone.id} dependency ${dependencyId} must exist`);
      assert.notEqual(dependencyId, milestone.id);
      assert.ok(
        releaseOrder.get(dependency.release) <= releaseOrder.get(milestone.release),
        `${milestone.id} must not depend on later release ${dependency.release}`,
      );
    }

    if (milestone.status === "ready") {
      assert.ok(
        milestone.dependsOn.every(
          (dependencyId) => milestones.get(dependencyId).status === "completed",
        ),
        `${milestone.id} cannot be ready while a dependency is incomplete`,
      );
    }

    if (milestone.status === "completed") {
      assert.ok(
        milestone.evidence?.length > 0,
        `${milestone.id} completion requires evidence`,
      );
      assert.ok(
        milestoneEvidence.has(milestone.id),
        `${milestone.id} completion requires an evidence manifest`,
      );
    }
  }

  const visiting = new Set();
  const visited = new Set();
  const visit = (milestoneId) => {
    assert.equal(
      visiting.has(milestoneId),
      false,
      `dependency cycle reaches ${milestoneId}`,
    );
    if (visited.has(milestoneId)) return;
    visiting.add(milestoneId);
    for (const dependencyId of milestones.get(milestoneId).dependsOn) {
      visit(dependencyId);
    }
    visiting.delete(milestoneId);
    visited.add(milestoneId);
  };
  for (const milestoneId of milestones.keys()) visit(milestoneId);
});

test("Full Release is a dedicated final evidence gate", () => {
  const milestones = new Map(
    roadmap.milestones.map((milestone) => [milestone.id, milestone]),
  );
  const fullRelease = roadmap.milestones.find(
    (milestone) => milestone.id === roadmap.fullReleaseMilestone,
  );
  assert.equal(fullRelease.release, "RG-7");
  assert.equal(fullRelease.risk, "R3");
  assert.match(fullRelease.outcome, /persistent public Germany world/i);
  assert.ok(
    fullRelease.exitCriteria.some((criterion) => /30 production days/i.test(criterion)),
  );
  assert.ok(
    fullRelease.exitCriteria.some((criterion) =>
      /double occupation/i.test(criterion),
    ),
  );
  assert.ok(
    fullRelease.exitCriteria.some((criterion) =>
      /ledger/i.test(criterion),
    ),
  );

  const transitiveDependencies = new Set();
  const collectDependencies = (milestoneId) => {
    if (transitiveDependencies.has(milestoneId)) return;
    transitiveDependencies.add(milestoneId);
    for (const dependencyId of milestones.get(milestoneId).dependsOn) {
      collectDependencies(dependencyId);
    }
  };
  collectDependencies(fullRelease.id);
  assert.deepEqual(
    [...transitiveDependencies].sort(),
    [...milestones.keys()].sort(),
    "Full Release must transitively depend on every planned milestone",
  );
});

test("milestone evidence template records reproducible delivery proof", () => {
  assert.equal(evidenceTemplate.schemaVersion, 1);
  assert.match(evidenceTemplate.milestoneId, /^MS-\d{3}$/);
  assert.equal(evidenceTemplate.status, "verifying");
  assert.deepEqual(Object.keys(evidenceTemplate.sources).sort(), [
    "adrs",
    "contracts",
    "specifications",
  ]);
  assert.ok(Array.isArray(evidenceTemplate.verification.commands));
  assert.ok(Array.isArray(evidenceTemplate.verification.artifacts));
  assert.ok(Array.isArray(evidenceTemplate.verification.invariantResults));
  assert.ok(Array.isArray(evidenceTemplate.operations.rollbackEvidence));
  assert.ok(Array.isArray(evidenceTemplate.reviews.independentReviewers));
  assert.ok(Array.isArray(evidenceTemplate.reviews.humanApprovals));

  for (const [milestoneId, evidence] of milestoneEvidence) {
    assert.match(milestoneId, /^MS-\d{3}$/);
    assert.equal(evidence.status, "completed");
    assert.match(evidence.candidateCommit, /^[0-9a-f]{40}$/);
    assert.match(evidence.completedAt, /^\d{4}-\d{2}-\d{2}T/);
    assert.ok(evidence.sources.specifications.length > 0);
    assert.ok(evidence.verification.commands.length > 0);
    assert.ok(evidence.verification.artifacts.length > 0);
    assert.ok(evidence.reviews.independentReviewers.length > 0);
  }
});
