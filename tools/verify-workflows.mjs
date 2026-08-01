// SPDX-FileCopyrightText: 2026 Zugfolge contributors
// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import YAML from "yaml";

const REPOSITORY_ROOT = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const FULL_SHA = /^[0-9a-f]{40}$/;

function entries(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? Object.entries(value)
    : [];
}

function assertPermissions(permissions, label, codeqlJob = false) {
  assert.ok(permissions && typeof permissions === "object", `${label} needs permissions`);
  for (const [name, access] of entries(permissions)) {
    const allowedWrite = codeqlJob && name === "security-events" && access === "write";
    assert.ok(
      access === "read" || allowedWrite,
      `${label} grants forbidden ${name}: ${access}`,
    );
  }
  assert.equal(permissions.contents, "read", `${label} must retain contents: read`);
}

export function validateWorkflowPolicy({
  actionRecords,
  dependabot,
  documentation,
  workflowSources,
}) {
  const approvedActions = new Map(
    actionRecords.map(({ repository, sha }) => [repository, sha]),
  );
  const observedActions = new Map();

  for (const [fileName, source] of Object.entries(workflowSources)) {
    assert.doesNotMatch(source, /\bpull_request_target\s*:/, `${fileName} is privileged`);
    assert.doesNotMatch(source, /\$\{\{\s*secrets\./, `${fileName} consumes repository secrets`);
    const workflow = YAML.parse(source);
    assertPermissions(workflow.permissions, `${fileName} workflow`);
    for (const [jobName, job] of entries(workflow.jobs)) {
      if (job.permissions) {
        assertPermissions(job.permissions, `${fileName}:${jobName}`, jobName === "codeql");
      }
      for (const [stepIndex, step] of (job.steps ?? []).entries()) {
        if (!step.uses || step.uses.startsWith("./")) continue;
        const match = step.uses.match(/^([^@]+)@(.+)$/);
        assert.ok(match, `${fileName}:${jobName}:${stepIndex} has malformed uses`);
        const [, actionPath, reference] = match;
        const repository = actionPath.split("/").slice(0, 2).join("/");
        assert.match(reference, FULL_SHA, `${fileName} uses mutable ${step.uses}`);
        assert.equal(
          reference,
          approvedActions.get(repository),
          `${fileName} uses unapproved ${repository}@${reference}`,
        );
        observedActions.set(repository, reference);
        assert.match(
          source,
          new RegExp(`uses:\\s*${actionPath.replaceAll("/", "\\/")}@${reference}\\s+#\\s*\\S+`),
          `${fileName} must retain a release comment for ${repository}`,
        );
      }
    }
  }

  assert.deepEqual(
    [...observedActions.entries()].sort(),
    [...approvedActions.entries()].sort(),
    "workflow action inventory differs from the approved dependency register",
  );

  const security = YAML.parse(workflowSources["security.yml"]);
  assert.equal(
    security.jobs["dependency-review"].steps.at(-1).with["fail-on-severity"],
    "high",
    "Dependency Review must reject High severity",
  );
  const supplyChainSource = workflowSources["supply-chain.yml"];
  const supplyChain = YAML.parse(supplyChainSource);
  const supplyCheckout = supplyChain.jobs.evidence.steps.find(
    (step) => step.uses?.startsWith("actions/checkout@"),
  );
  assert.equal(
    supplyCheckout?.with?.["fetch-depth"],
    0,
    "supply-chain evidence requires the complete Git history",
  );
  const upload = supplyChain.jobs.evidence.steps.find(
    (step) => step.uses?.startsWith("actions/upload-artifact@"),
  );
  assert.ok(upload, "supply-chain evidence upload is missing");
  assert.equal(upload.with["retention-days"], 30, "evidence retention must be 30 days");
  assert.equal(upload.with["if-no-files-found"], "error");
  assert.match(supplyChainSource, /artifact-digest/);
  assert.match(supplyChainSource, /Retention: 30 days/);

  assert.equal(dependabot.version, 2);
  assert.deepEqual(
    dependabot.updates.map((update) => update["package-ecosystem"]).sort(),
    ["github-actions", "gradle", "npm", "pip"],
  );
  for (const update of dependabot.updates) {
    assert.equal(update.directory, "/");
    assert.equal(update.schedule.interval, "weekly");
  }
  assert.doesNotMatch(JSON.stringify(dependabot), /auto.?merge/i);
  assert.match(documentation, /sha_pinning_required: true/);
  return { actions: observedActions.size, workflows: Object.keys(workflowSources).length };
}

export async function verifyWorkflowTree(repositoryRoot = REPOSITORY_ROOT) {
  const workflowDirectory = path.join(repositoryRoot, ".github", "workflows");
  const workflowFiles = (await readdir(workflowDirectory))
    .filter((fileName) => /\.ya?ml$/i.test(fileName))
    .sort();
  const workflowSources = Object.fromEntries(
    await Promise.all(
      workflowFiles.map(async (fileName) => [
        fileName,
        await readFile(path.join(workflowDirectory, fileName), "utf8"),
      ]),
    ),
  );
  const [dependencySource, dependabotSource, documentation] = await Promise.all([
    readFile(path.join(repositoryRoot, "compliance", "dependencies.yaml"), "utf8"),
    readFile(path.join(repositoryRoot, ".github", "dependabot.yml"), "utf8"),
    readFile(path.join(repositoryRoot, "docs", "DEPENDENCIES.md"), "utf8"),
  ]);
  return validateWorkflowPolicy({
    actionRecords: YAML.parse(dependencySource).githubActions,
    dependabot: YAML.parse(dependabotSource),
    documentation,
    workflowSources,
  });
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const result = await verifyWorkflowTree();
  console.log(`Verified ${result.workflows} workflows and ${result.actions} immutable Actions.`);
}
