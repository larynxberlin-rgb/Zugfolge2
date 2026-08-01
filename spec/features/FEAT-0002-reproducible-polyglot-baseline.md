# FEAT-0002: Reproducible polyglot engineering baseline

**Status:** Accepted\
**Version:** 1.0\
**Milestone:** MS-002\
**Release gate:** RG-0\
**Owner:** Architecture Steward\
**Required approver:** Human Security Reviewer
**Accepted:** 2026-08-01\
**Approval evidence:** [MS-002-S01 human security decision](https://github.com/larynxberlin-rgb/Zugfolge/issues/3#issuecomment-5150191133)

## Purpose

Zugfolge needs one reviewable engineering baseline for its TypeScript,
Kotlin/JVM 21, and Python code before authoritative game behavior is added.
This feature specifies repository and build behavior only. It does not select
production persistence, messaging, identity, deployment, mapping, or
observability services.

The repository owner explicitly assumed the human Security Reviewer decision
for this baseline on 1 August 2026. The accepted decision covers the dependency
policy, GitHub Actions permissions, software-bill-of-materials tooling, runner
images, bootstrap channels, and retention policy. Acceptance authorizes only
the bounded `MS-002` implementation slices; each slice must still prove the
exact artifacts, locks, permissions, and rollback behavior it introduces.

## User and maintainer outcome

A contributor or implementation agent with a clean supported machine can
bootstrap, build, lint, and test all three language stacks by following one
documented command sequence. CI performs the same locked operations on Windows
and Linux, explains which phase failed, and retains reviewable evidence without
receiving production secrets or write access.

## Scope

### In scope

- exact, repository-owned toolchain and package-manager pins;
- one pnpm workspace and lockfile for TypeScript/JavaScript;
- one uv workspace and lockfile for Python;
- Gradle Kotlin DSL, the checked-in Gradle wrapper, JVM 21 toolchains, and
  dependency verification for Kotlin;
- explicit module boundaries without adding game behavior;
- frozen dependency installation, compilation, lint, tests, coverage
  foundations, schema/spec validation, secret scanning, dependency review,
  CycloneDX SBOM generation, and evidence retention;
- supported Windows and Linux developer workflows;
- dependency-purpose and license records for newly introduced tooling.

### Out of scope

- moving the current web application solely to match the eventual target tree;
- HTTP frameworks, databases, PostGIS, brokers, Keycloak, Odoo, containers,
  Kubernetes, map servers, or provider integrations;
- production deployment, signing, attestations, or release promotion;
- public API, AsyncAPI, JSON Schema, game-domain, simulation, economy, or
  monetization behavior;
- coverage percentage gates beyond establishing trustworthy collection and
  publishing. The repository-wide quality target is introduced only with
  measured baselines and an accepted policy change.

## Normative requirements

### TOOL-001 — Repository-owned pins

The repository MUST identify the exact Node.js, pnpm, Python, uv, Gradle,
Kotlin, and test-tool versions used by local verification and CI. A clean build
MUST NOT silently select a newer package-manager, compiler, build tool, or CI
action.

The selected Node.js release MUST be an official LTS release. The selected Java
toolchain MUST target JVM 21. The selected Python line MUST remain supported by
all Python workspace members.

### TOOL-002 — Locked dependency resolution

TypeScript/JavaScript MUST use pnpm workspaces and one committed
`pnpm-lock.yaml`. Python MUST use one committed uv workspace lock. Kotlin MUST
use the committed Gradle wrapper, dependency locking where applicable, and
Gradle dependency-verification metadata.

CI MUST use frozen or locked modes and MUST fail before build execution when a
manifest and its lock or verification metadata disagree. npm, Yarn, pip, and a
system Gradle installation MUST NOT be alternative resolution paths.

### TOOL-003 — Bootstrap and verification interface

`docs/DEVELOPMENT.md` MUST contain one ordered bootstrap and verification
sequence for each supported shell. The sequence MUST resolve to the same
repository-owned verification phases:

1. toolchain preflight;
2. frozen dependency synchronization;
3. specification and contract validation;
4. TypeScript checks;
5. Python checks;
6. Kotlin checks;
7. repository security and dependency-policy checks;
8. SBOM and evidence generation.

A root verification command MUST stop on the first failed phase, return a
non-zero exit code, and identify the failed phase without printing secrets,
environment contents, or user-specific absolute paths.

### TOOL-004 — Module boundaries

Every executable or reusable module MUST have an explicit package or Gradle
project identity. TypeScript modules MUST consume workspace packages through
declared exports. Kotlin modules MUST depend only on declared Gradle projects
and public application interfaces. Python modules MUST declare their workspace
dependencies.

No module MAY import another module's private source tree, generated output,
virtual environment, Gradle build directory, pnpm store, or cache.

The existing browser application MAY remain at the repository root during
`MS-002`; relocating it is not required to prove the toolchain baseline.

### TOOL-005 — Generated and cached state

Generated output, coverage output, virtual environments, package stores,
compiler caches, and local test evidence MUST be ignored. Lockfiles, the Gradle
wrapper and its properties, dependency verification metadata, schemas,
specifications, and small deterministic fixtures MUST be tracked.

A repository-policy check MUST fail if a forbidden generated directory or an
unapproved package-manager lockfile is tracked.

### TOOL-006 — Dependency policy

Every direct build, runtime, test, CI-action, and SBOM dependency introduced by
`MS-002` MUST have a repository record containing:

- exact identity or immutable commit;
- purpose and owning slice;
- license;
- official source;
- execution or trust boundary;
- update and rollback method.

CI actions MUST be pinned to full-length commit SHAs with a human-readable
release comment. Untrusted pull-request content MUST NOT execute with repository
write permissions or repository secrets.

### TOOL-007 — Least-privilege CI

Workflow-level permissions MUST default to `contents: read`. A job MAY receive
an additional permission only when its documented function requires it.
`pull_request_target` MUST NOT execute code from a pull request. Production,
billing, provider, Odoo, and deployment credentials MUST NOT be available to
the engineering-baseline workflows.

Windows and Linux jobs MUST use explicit supported runner images rather than a
mutable `*-latest` label once the human security reviewer approves those
images.

### TOOL-008 — Coverage and test evidence

Each language stack MUST produce machine-readable test and coverage output in a
documented generated directory. Absence of expected test output MUST fail the
relevant verification phase. Coverage collection MUST NOT weaken, skip, or
replace existing tests.

### TOOL-009 — SBOM and retention

A successful clean verification MUST produce valid CycloneDX JSON covering the
resolved TypeScript, Python, and Kotlin dependency graphs. Components MUST be
traceable to their ecosystem lock or verification metadata.

CI MUST upload SBOM, test, and coverage evidence with an explicit retention
period and expose the artifact digest. These artifacts MUST NOT contain source
credentials, environment dumps, package-registry tokens, personal data, or
production data.

### TOOL-010 — No premature platform services

The engineering baseline MUST remain runnable without PostgreSQL, NATS,
Keycloak, Redis/Valkey, Odoo, an object store, map services, Docker, or
Kubernetes. Introducing any of these in `MS-002` is a scope violation.

## Acceptance scenarios

### AC-001 — Clean Linux checkout

**Given** a clean checkout on the approved Linux image with only the documented
bootstrap prerequisites\
**When** the maintainer runs the documented sequence\
**Then** all three stacks build and test from locked dependencies\
**And** the command exits successfully with evidence for every phase.

### AC-002 — Clean Windows checkout

**Given** a clean checkout on the approved Windows image with the documented
PowerShell prerequisites\
**When** the maintainer runs the documented sequence\
**Then** the same logical phases and locked dependency graphs pass\
**And** no POSIX-only path or shell assumption is required.

### AC-003 — Manifest drift

**Given** a package manifest that no longer matches its committed lock or
verification metadata\
**When** verification starts\
**Then** the dependency phase fails before compilation\
**And** the error identifies the stale ecosystem without modifying the lock.

### AC-004 — Toolchain drift

**Given** a missing or unsupported Node.js, pnpm, Python, uv, Java, or Gradle
toolchain\
**When** preflight runs\
**Then** verification fails with the expected version and official installation
reference\
**And** it does not silently fall back to a system package manager.

### AC-005 — Boundary violation

**Given** a module imports another module's private source or generated output\
**When** repository-policy verification runs\
**Then** the build fails and identifies both modules and the forbidden edge.

### AC-006 — Unreviewed dependency

**Given** a direct dependency or GitHub Action without purpose, license, trust
boundary, or immutable version evidence\
**When** dependency-policy verification runs\
**Then** CI fails before the dependency can be accepted.

### AC-007 — Mutable CI action

**Given** a workflow references an external action by a tag or branch\
**When** workflow policy validation runs\
**Then** CI fails and reports the workflow location.

### AC-008 — Secret-like fixture

**Given** a safe synthetic credential marker in the scanner's test fixture\
**When** the secret-scan verification test runs\
**Then** the scanner reports the fixture\
**And** ordinary repository verification contains no live secret material.

### AC-009 — SBOM evidence

**Given** a successful locked build\
**When** evidence generation completes\
**Then** the CycloneDX document validates\
**And** every resolved direct dependency is represented\
**And** CI reports the uploaded artifact digest and approved retention period.

### AC-010 — Existing foundation remains valid

**Given** the completed `MS-000` foundation\
**When** the polyglot baseline is verified\
**Then** the current web build, contracts, domain reference tests, data pipeline
tests, Odoo boundary tests, roadmap tests, and repository-policy tests still
pass\
**And** no public contract or game invariant changes.

## Failure, rollback, and observability

- Every implementation slice MUST preserve a previously working local command
  until its replacement passes on both supported operating systems.
- Package-manager migrations MUST remove the superseded lock only in the same
  commit that adds and verifies the replacement lock.
- Gradle, uv, pnpm, coverage, SBOM, and CI additions MUST be independently
  revertible; there is no persistence or production-data migration.
- CI phase names, duration, result, and artifact digests are the only
  engineering-baseline observability. No production telemetry service is
  introduced.
- A failed artifact upload MUST fail the evidence job but MUST NOT rerun tests
  with broader permissions.

## Security approval record

The accepted human security review decides:

1. `ubuntu-24.04` and `windows-2025` are the supported CI images; Node.js
   `24.18.0`, pnpm `11.18.0`, CPython `3.13.14`, uv `0.12.0`, Eclipse Temurin
   `21.0.12+8`, Gradle `9.5.0`, Kotlin `2.4.10`, and JUnit `6.1.2` are the
   baseline toolchains;
2. CI bootstraps pnpm and uv only through the approved immutable Actions, while
   local bootstrap uses the exact official registry package or versioned
   installer recorded in `docs/DEPENDENCIES.md`; Corepack is not the CI trust
   root;
3. built-in Node coverage, coverage.py `7.15.2`, JaCoCo `0.8.15`, Gitleaks CLI
   `8.30.1`, native pnpm SBOM, `cyclonedx-bom==7.3.1`, and
   `org.cyclonedx.bom` `3.3.0` are approved; an optional cross-ecosystem CLI is
   not part of `MS-002`;
4. temporary test, coverage, and CycloneDX artifacts are retained for 30 days,
   while permanent evidence records only commit and artifact digests;
5. every Action uses the exact tag-to-commit SHA recorded in
   `docs/DEPENDENCIES.md`; permissions default to `contents: read`, with only
   the CodeQL analysis job receiving `security-events: write`;
6. repository full-SHA enforcement is enabled before the S06 workflow is
   accepted when supported, repository policy tests remain mandatory, and
   weekly Dependabot update pull requests never auto-merge.

The permanent approval is linked from the
[MS-002 coordinating issue](https://github.com/larynxberlin-rgb/Zugfolge/issues/2#issuecomment-5150191185).
This record does not approve a production service, provider, deployment path,
or game behavior.
