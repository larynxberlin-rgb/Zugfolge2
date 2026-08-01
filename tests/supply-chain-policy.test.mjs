import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import YAML from "yaml";

import {
  validateWorkflowPolicy,
  verifyWorkflowTree,
} from "../tools/verify-workflows.mjs";
import { validateCycloneDx } from "../tools/verify-sbom.mjs";

const REPOSITORY_ROOT = path.resolve(fileURLToPath(new URL("..", import.meta.url)));

async function policyFixture() {
  const workflowNames = ["ci.yml", "security.yml", "supply-chain.yml"];
  const workflowSources = Object.fromEntries(
    await Promise.all(
      workflowNames.map(async (name) => [
        name,
        await readFile(path.join(REPOSITORY_ROOT, ".github", "workflows", name), "utf8"),
      ]),
    ),
  );
  return {
    actionRecords: YAML.parse(
      await readFile(path.join(REPOSITORY_ROOT, "compliance", "dependencies.yaml"), "utf8"),
    ).githubActions,
    dependabot: YAML.parse(
      await readFile(path.join(REPOSITORY_ROOT, ".github", "dependabot.yml"), "utf8"),
    ),
    documentation: await readFile(
      path.join(REPOSITORY_ROOT, "docs", "DEPENDENCIES.md"),
      "utf8",
    ),
    workflowSources,
  };
}

test("S06 workflow policy accepts only immutable least-privilege evidence", async () => {
  const result = await verifyWorkflowTree();
  assert.deepEqual(result, { actions: 9, workflows: 3 });
});

test("workflow policy rejects mutable Actions, privileged triggers, and writes", async () => {
  const fixture = await policyFixture();
  for (const mutate of [
    (copy) => {
      copy.workflowSources["ci.yml"] = copy.workflowSources["ci.yml"].replace(
        /actions\/checkout@[0-9a-f]{40}/,
        "actions/checkout@v7",
      );
    },
    (copy) => {
      copy.workflowSources["security.yml"] = copy.workflowSources["security.yml"].replace(
        "pull_request:",
        "pull_request_target:",
      );
    },
    (copy) => {
      copy.workflowSources["supply-chain.yml"] = copy.workflowSources[
        "supply-chain.yml"
      ].replace("  contents: read", "  contents: read\n  packages: write");
    },
  ]) {
    const copy = structuredClone(fixture);
    mutate(copy);
    assert.throws(() => validateWorkflowPolicy(copy));
  }
});

test("workflow policy rejects weak dependency review and evidence retention", async () => {
  const fixture = await policyFixture();
  for (const [fileName, before, after] of [
    ["security.yml", "fail-on-severity: high", "fail-on-severity: moderate"],
    ["supply-chain.yml", "retention-days: 30", "retention-days: 29"],
    ["supply-chain.yml", "fetch-depth: 0", "fetch-depth: 1"],
  ]) {
    const copy = structuredClone(fixture);
    copy.workflowSources[fileName] = copy.workflowSources[fileName].replace(before, after);
    assert.throws(() => validateWorkflowPolicy(copy));
  }
});

function gitleaksAvailable() {
  const command = process.platform === "win32" ? "gitleaks.exe" : "gitleaks";
  return spawnSync(command, ["version"], { encoding: "utf8" }).status === 0;
}

test(
  "Gitleaks reports a safe synthetic marker without exposing its value",
  { skip: !gitleaksAvailable() },
  async () => {
    const temporaryRepository = await mkdtemp(path.join(os.tmpdir(), "zugfolge-gitleaks-"));
    const marker = "ZUGFOLGE_TEST_" + "SECRET_" + "A1B2C3D4E5F6G7H8";
    try {
      execFileSync("git", ["init", "--quiet"], { cwd: temporaryRepository });
      execFileSync("git", ["config", "user.email", "test@invalid.example"], {
        cwd: temporaryRepository,
      });
      execFileSync("git", ["config", "user.name", "Zugfolge Test"], {
        cwd: temporaryRepository,
      });
      await writeFile(path.join(temporaryRepository, "fixture.txt"), `${marker}\n`, "utf8");
      execFileSync("git", ["add", "fixture.txt"], { cwd: temporaryRepository });
      execFileSync("git", ["commit", "--quiet", "-m", "safe scanner fixture"], {
        cwd: temporaryRepository,
      });
      const command = process.platform === "win32" ? "gitleaks.exe" : "gitleaks";
      const reportPath = path.join(temporaryRepository, "report.json");
      const result = spawnSync(
        command,
        [
          "git",
          temporaryRepository,
          `--config=${path.join(REPOSITORY_ROOT, ".gitleaks.toml")}`,
          "--redact",
          "--no-banner",
          "--report-format=json",
          `--report-path=${reportPath}`,
        ],
        { encoding: "utf8" },
      );
      assert.equal(result.status, 1);
      const report = await readFile(reportPath, "utf8");
      assert.equal(JSON.parse(report)[0].RuleID, "zugfolge-synthetic-secret");
      assert.doesNotMatch(`${report}${result.stdout}${result.stderr}`, new RegExp(marker));
    } finally {
      await rm(temporaryRepository, { force: true, recursive: true });
    }
  },
);

test("CycloneDX validation fails closed on missing or unresolved evidence", () => {
  const valid = {
    bomFormat: "CycloneDX",
    specVersion: "1.6",
    version: 1,
    metadata: { component: { "bom-ref": "root", name: "root", version: "1" } },
    components: [{ "bom-ref": "pkg", name: "dependency", version: "1" }],
    dependencies: [
      { ref: "root", dependsOn: ["pkg"] },
      { ref: "pkg", dependsOn: [] },
    ],
  };
  assert.doesNotThrow(() => validateCycloneDx(valid, "fixture"));
  assert.throws(() => validateCycloneDx({ ...valid, components: [] }, "fixture"));
  assert.throws(() =>
    validateCycloneDx(
      { ...valid, dependencies: [{ ref: "pkg", dependsOn: [] }] },
      "fixture",
    ),
  );
  assert.throws(() =>
    validateCycloneDx(
      { ...valid, dependencies: [{ ref: "root", dependsOn: ["missing"] }] },
      "fixture",
    ),
  );
});
