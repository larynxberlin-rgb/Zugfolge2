# MS-002 kickoff: Reproducible polyglot engineering baseline

**Milestone:** `MS-002`\
**Release gate:** `RG-0`\
**Risk:** `R3`\
**Effort:** `M`\
**Preparation status:** human security approval recorded; S01 acceptance in progress\
**GitHub milestone:** [MS-002](https://github.com/larynxberlin-rgb/Zugfolge/milestone/1)
**Coordinating issue:** [#2](https://github.com/larynxberlin-rgb/Zugfolge/issues/2)

This file records the repository-controlled preparation gate. GitHub issues are
the execution view and MUST link back here and to
`spec/features/FEAT-0002-reproducible-polyglot-baseline.md`.

## Dependency evidence

`MS-002` depends only on `MS-000`.

- `planning/milestones.yaml` records `MS-000` as `completed`.
- `planning/evidence/MS-000.yaml` identifies the accepted specifications,
  contracts, verification commands, CI runs, limitations, and candidate commit.
- The current roadmap change adds no game behavior or production dependency.

The repository-controlled dependency gate is therefore satisfied.

## Authoritative sources

- `AGENTS.md`
- `spec/00-product-constitution.md`
- `spec/glossary.md`
- `spec/adr/ADR-0001-contract-first-modular-architecture.md`
- `spec/adr/ADR-0005-polyglot-build-and-supply-chain-policy.md`
- `spec/features/FEAT-0002-reproducible-polyglot-baseline.md`
- `planning/milestones.yaml` entries `RG-0`, `MS-000`, `MS-002`, and `MS-003`
- `.github/workflows/ci.yml`
- `.github/workflows/security.yml`

No public OpenAPI, AsyncAPI, JSON Schema, persistence, replay, or game-domain
contract changes are authorized by this milestone.

## Current repository baseline

| Area | Current state | Required MS-002 change |
|---|---|---|
| TypeScript | root npm project, `package-lock.json`, Node 22.13 minimum | pinned Node LTS, pnpm workspace and lock |
| Python | two independent `pyproject.toml` files, Python 3.12, no lock | root uv workspace and one lock |
| Kotlin | no Kotlin source, Gradle wrapper, or JVM CI | Kotlin DSL multi-project baseline on JVM 21 |
| CI | Ubuntu-only npm/Python checks | locked Windows/Linux polyglot verification |
| Security | CodeQL and dependency review, immutable Action SHAs | secret scan, dependency policy, SBOM and evidence retention |
| Coverage | no shared machine-readable output contract | one generated evidence layout per ecosystem |
| Services | no runtime service dependency | remain service-free in MS-002 |

## Approved version baseline

These policy pins were approved on 1 August 2026. They are introduced only by
their owning implementation slices and remain absent until then:

| Toolchain | Policy pin | Rationale |
|---|---|---|
| Node.js | `24.18.0` LTS | current official LTS patch; pnpm 11 supports Node 24 |
| pnpm | `11.18.0` | current stable 11.x release |
| Python | `3.13.14` | official source and signed Windows binaries exist; current packages and the planned GIS stack still require compatibility evidence |
| uv | `0.12.0` | current version-addressable official release and workspace tooling |
| Java | Eclipse Temurin `21.0.12+8` | current official JVM 21 maintenance build; reviewer must approve platform artifacts/checksums |
| Gradle | `9.5.0` | latest release fully covered by Kotlin 2.4.10's Gradle support matrix |
| Kotlin | `2.4.10` | current stable Kotlin release |
| JUnit | `6.1.2` | current stable Jupiter release; requires Java 17+ |
| Python coverage | coverage.py `7.15.2` | current stable Apache-2.0 coverage tool |
| JVM coverage | JaCoCo `0.8.15` | current stable EPL-2.0 coverage tool |
| Secret scan | Gitleaks CLI `8.30.1` | official checksummed MIT release; no Action wrapper |
| Evidence retention | 30 days | review window with permanent digests in milestone evidence |

Before any approved dependency is committed, its exact artifact, license,
checksum or lock mechanism, compatibility, and update path MUST match the
dependency record and pass the owning slice's verification.

## Bounded delivery slices

The order below keeps the milestone within effort band `M` and isolates the
R3 workflow change.

| Slice | GitHub issue |
|---|---|
| `MS-002-S01` | [#3](https://github.com/larynxberlin-rgb/Zugfolge/issues/3) |
| `MS-002-S02` | [#4](https://github.com/larynxberlin-rgb/Zugfolge/issues/4) |
| `MS-002-S03` | [#5](https://github.com/larynxberlin-rgb/Zugfolge/issues/5) |
| `MS-002-S04` | [#6](https://github.com/larynxberlin-rgb/Zugfolge/issues/6) |
| `MS-002-S05` | [#7](https://github.com/larynxberlin-rgb/Zugfolge/issues/7) |
| `MS-002-S06` | [#8](https://github.com/larynxberlin-rgb/Zugfolge/issues/8) |
| `MS-002-S07` | [#9](https://github.com/larynxberlin-rgb/Zugfolge/issues/9) |
| `MS-002-S08` | [#10](https://github.com/larynxberlin-rgb/Zugfolge/issues/10) |

### MS-002-S01 — Accept the engineering and dependency policy

- **Outcome:** `FEAT-0002` and a dependency record are accepted with every open
  security decision resolved.
- **Risk:** R3 because the accepted policy controls dependency and CI trust.
- **Allowed paths:** `/spec/features/FEAT-0002-reproducible-polyglot-baseline.md`,
  `/spec/adr/ADR-0005-polyglot-build-and-supply-chain-policy.md`,
  `/spec/README.md`, `/tests/ms002-preparation.test.mjs`,
  `/planning/MS-002-KICKOFF.md`, `/planning/milestones.yaml`,
  `/docs/DEVELOPMENT.md`, `/docs/DEPENDENCIES.md`, and `/docs/ROADMAP.md`.
- **Forbidden:** package manifests, lockfiles, workflows, application code,
  public contracts, and repository settings.
- **Acceptance:** the human security approval covers every item under
  `FEAT-0002` “Security approval record”; no unresolved implementation choice
  remains.
- **Rollback:** revert documentation and keep `MS-002` at `ready`.
- **Observability:** none beyond review evidence.
- **Verification:** run `npm run lint`, `npm test`,
  `python -m unittest discover -s apps/data-pipeline/tests -v`,
  `python -m unittest discover -s integrations/odoo/tests -v`, and
  `git diff --check`; then record independent architecture review and the human
  Security Reviewer decision in issue
  [#3](https://github.com/larynxberlin-rgb/Zugfolge/issues/3).

### MS-002-S02 — Migrate the JavaScript toolchain to pnpm

- **Depends on:** S01.
- **Outcome:** the existing web, contract, domain, and roadmap checks use an
  exact pnpm toolchain and one frozen lock.
- **Risk:** R3 because the package manager and resolved dependency graph are a
  supply-chain boundary.
- **Allowed paths:** `/package.json`, removal of `/package-lock.json`,
  `/pnpm-lock.yaml`, `/pnpm-workspace.yaml`, `/.npmrc`, `/.node-version`,
  `/.github/workflows/ci.yml`,
  `/.gitignore`, `/tests/repository-policy.test.mjs`,
  `/tests/ms002-toolchain.test.mjs`, `/tests/ms002-preparation.test.mjs`,
  `/tests/compliance.test.mjs`, `/compliance/dependencies.yaml`, `/REUSE.toml`,
  `/scripts/generate-third-party-notices.mjs`,
  `/tests/third-party-notices.test.mjs`,
  `/public/legal/THIRD-PARTY-NOTICES.txt`,
  `/planning/MS-002-KICKOFF.md`, `/README.md`,
  `/docs/DEVELOPMENT.md`, and `/docs/DEPENDENCIES.md`.
- **Forbidden:** moving the web application, changing rendered behavior,
  security/supply-chain workflows, Python/Kotlin jobs, runner-matrix rollout,
  contracts, or production services. The existing web CI job may change only
  enough to execute this pnpm lock with the approved immutable Node/pnpm
  Actions.
- **Acceptance:** AC-003, AC-004, AC-010 for the JavaScript stack; frozen install
  and all existing Node checks pass twice without lock drift.
- **Rollback:** restore `package-lock.json` and npm commands in one revert.
- **Observability:** phase-labelled local command output only.
- **Verification:** run `pnpm install --frozen-lockfile`,
  `pnpm exec tsc --noEmit`, `pnpm run lint`, `pnpm run build`, `pnpm test`,
  `pnpm install --frozen-lockfile` a second time, and
  `git diff --exit-code -- package.json pnpm-lock.yaml`; the Node tests include
  the dependency-license and lock-policy assertions.

### MS-002-S03 — Create the locked uv workspace

- **Depends on:** S01.
- **Outcome:** the data-pipeline and Odoo bridge share one exact Python
  environment without gaining a runtime dependency on one another.
- **Risk:** R3 because the workspace lock and build backend execute downloaded
  code.
- **Allowed paths:** `/pyproject.toml`, `/uv.lock`, `/build-constraints.txt`, `/.python-version`,
  `/.github/workflows/ci.yml`, `/compliance/dependencies.yaml`,
  `/tests/compliance.test.mjs`, `/REUSE.toml`,
  `/planning/MS-002-KICKOFF.md`,
  `/apps/data-pipeline/pyproject.toml`,
  `/apps/data-pipeline/tests/test_provenance.py`,
  `/integrations/odoo/pyproject.toml`,
  `/integrations/odoo/tests/test_webhook.py`, `/.gitignore`, `/README.md`,
  `/docs/DEVELOPMENT.md`, and `/docs/DEPENDENCIES.md`.
- **Forbidden:** Python domain behavior, provider code/data, Odoo runtime
  integration, security/supply-chain workflows, web/Kotlin jobs, runner-matrix
  rollout, and public contracts. The existing Python CI job may change only
  enough to execute the approved exact Python/uv workspace and current tests.
- **Acceptance:** AC-003, AC-004, AC-010 for Python;
  `uv sync --all-packages --locked` and both existing test suites pass from an
  empty environment.
- **Rollback:** remove the root workspace/lock/constraint set and restore independent
  build-system metadata.
- **Observability:** phase-labelled local command output only.
- **Verification:** run `uv sync --all-packages --locked`,
  `uv run python -m compileall -q apps/data-pipeline/src integrations/odoo/src`,
  `uv run python -m unittest discover -s apps/data-pipeline/tests -v`,
  `uv run python -m unittest discover -s integrations/odoo/tests -v`,
  `uv build --package zugfolge-data-pipeline --build-constraints build-constraints.txt --require-hashes`,
  `uv build --package zugfolge-odoo-bridge --build-constraints build-constraints.txt --require-hashes`,
  `uv sync --all-packages --locked` a second time, and
  `git diff --exit-code -- pyproject.toml uv.lock build-constraints.txt apps/data-pipeline/pyproject.toml integrations/odoo/pyproject.toml`.

### MS-002-S04 — Add the JVM 21 Gradle/Kotlin foundation

- **Depends on:** S01.
- **Outcome:** a framework-free Kotlin module compiles and tests through a
  checksum-verified Gradle wrapper and proves declared module boundaries.
- **Risk:** R3 because the wrapper, compiler plugins, and dependency
  verification are a supply-chain boundary.
- **Allowed paths:** `/settings.gradle.kts`, `/build.gradle.kts`,
  `/gradle.properties`, `/gradle/libs.versions.toml`,
  `/gradle/verification-metadata.xml`, `/gradle.lockfile`,
  `/gradle/wrapper/gradle-wrapper.properties`,
  `/gradle/wrapper/gradle-wrapper.jar`, `/gradlew`, `/gradlew.bat`,
  `/.gitattributes`, `/.gitignore`, `/REUSE.toml`,
  `/planning/MS-002-KICKOFF.md`, `/apps/game-server/build.gradle.kts`,
  `/apps/game-server/gradle.lockfile`,
  `/apps/game-server/src/main/kotlin/de/zugfolge/game/GameServerModule.kt`,
  `/apps/game-server/src/test/kotlin/de/zugfolge/architecture/EngineeringBaselineTest.kt`,
  `/apps/game-server/README.md`, `/tools/verify-gradle-wrapper.mjs`,
  `/tests/ms002-toolchain.test.mjs`, `/docs/DEVELOPMENT.md`, and
  `/docs/DEPENDENCIES.md`.
- **Forbidden:** HTTP framework, persistence, messaging, identity, game
  behavior, workflow changes, or public contracts.
- **Acceptance:** AC-003 through AC-006 and AC-010 for JVM; a clean wrapper build
  uses JVM 21 and succeeds without system Gradle. Generated Gradle output uses
  `/.gradle-build` or another approved generated root and never collides with
  the tracked TypeScript source directory `/build`.
  `node tools/verify-gradle-wrapper.mjs` independently hashes the wrapper JAR
  and checks the pinned distribution URL/checksum against
  `/docs/DEPENDENCIES.md` before either wrapper script may execute.
- **Rollback:** remove the new JVM-only files; no data migration exists.
- **Observability:** Gradle/JUnit test results and phase-labelled command output
  only.
- **Verification:** first run `node tools/verify-gradle-wrapper.mjs`; then run
  `./gradlew --no-daemon --console=plain check` on Linux or
  `.\gradlew.bat --no-daemon --console=plain check` in PowerShell; finally run
  `git diff --exit-code -- gradle.lockfile apps/game-server/gradle.lockfile gradle/verification-metadata.xml`.

### MS-002-S05 — Add spec/schema lint and coverage foundations

- **Depends on:** S02, S03, S04.
- **Outcome:** accepted specifications/contracts and all three stacks produce
  machine-readable validation, test, and coverage evidence.
- **Risk:** R3 because new lint/coverage tooling executes repository input and
  downloaded code.
- **Allowed paths:** `/package.json`, `/pnpm-lock.yaml`, `/pyproject.toml`,
  `/uv.lock`, `/build.gradle.kts`, `/gradle/libs.versions.toml`,
  `/gradle/verification-metadata.xml`, `/gradle.lockfile`,
  `/apps/game-server/build.gradle.kts`, `/apps/game-server/gradle.lockfile`,
  `/.gitignore`, `/REUSE.toml`, `/compliance/dependencies.yaml`,
  `/tests/compliance.test.mjs`, `/planning/MS-002-KICKOFF.md`,
  `/tools/spec-lint.mjs`, `/tools/run-node-coverage.mjs`,
  `/tools/run-python-coverage.py`, `/tools/verify-local-evidence.mjs`,
  `/tests/tooling-policy.test.mjs`, `/tests/repository-policy.test.mjs`,
  `/public/legal/THIRD-PARTY-NOTICES.txt`, `/docs/DEVELOPMENT.md`, and
  `/docs/DEPENDENCIES.md`.
- **Forbidden:** changes to accepted product behavior, weakening existing
  contract tests, workflows, or production telemetry.
- **Acceptance:** invalid specification IDs, invalid OpenAPI/AsyncAPI/JSON
  Schema, missing test output, and module-boundary violations each fail the
  correct phase; all three stacks produce documented coverage reports.
- **Rollback:** remove the lint/coverage configuration while preserving every
  ecosystem's native tests.
- **Observability:** deterministic local test/coverage paths and phase result;
  no external upload.
- **Verification:** run `pnpm run verify:spec`, `pnpm run coverage:node`,
  `uv run python tools/run-python-coverage.py`,
  `./gradlew --no-daemon --console=plain test jacocoTestReport` on Linux or
  `.\gradlew.bat --no-daemon --console=plain test jacocoTestReport` in
  PowerShell, `node tools/verify-local-evidence.mjs`, and
  `node --test tests/tooling-policy.test.mjs tests/repository-policy.test.mjs`;
  record the independent testing review in issue
  [#7](https://github.com/larynxberlin-rgb/Zugfolge/issues/7).

### MS-002-S06 — Add supply-chain checks, secret scan, and SBOM

- **Depends on:** S05 and recorded human security approval.
- **Outcome:** immutable dependencies, a real secret scanner, and validated
  ecosystem CycloneDX documents are enforced before cross-platform CI rollout.
- **Risk:** R3.
- **Allowed paths:** `/.github/workflows/ci.yml`,
  `/.github/workflows/security.yml`, `/.github/workflows/supply-chain.yml`,
  `/.github/dependabot.yml`,
  `/.gitleaks.toml`, `/package.json`, `/pnpm-lock.yaml`, `/pyproject.toml`,
  `/uv.lock`, `/build.gradle.kts`, `/gradle/libs.versions.toml`,
  `/gradle/verification-metadata.xml`, `/gradle.lockfile`,
  `/apps/game-server/build.gradle.kts`, `/apps/game-server/gradle.lockfile`,
  `/tools/run-supply-chain.mjs`, `/tools/verify-workflows.mjs`,
  `/tools/verify-sbom.mjs`, `/tests/supply-chain-policy.test.mjs`,
  `/tests/repository-policy.test.mjs`, `/tests/compliance.test.mjs`,
  `/tests/tooling-policy.test.mjs`, `/compliance/dependencies.yaml`,
  `/REUSE.toml`, `/docs/DEPENDENCIES.md`, and `/docs/DEVELOPMENT.md`.
- **Forbidden:** `pull_request_target`, repository secrets, write permissions
  outside the existing CodeQL need, deployment, application behavior, and
  production services.
- **Acceptance:** AC-006 through AC-009; every `uses:` pin is a full SHA,
  Dependency Review rejects High severity, the scanner catches a safe synthetic
  marker, and three valid CycloneDX JSON documents are uploaded with explicit
  retention and digests.
- **Rollback:** disable/revert the isolated supply-chain workflow; S02–S05
  remain locally usable.
- **Observability:** job summary, scanner result, SBOM artifacts, retention, and
  digests only.
- **Verification:** run `node tools/verify-workflows.mjs`,
  `node --test tests/supply-chain-policy.test.mjs tests/repository-policy.test.mjs`,
  `gitleaks git --config=.gitleaks.toml --redact --no-banner`,
  `node tools/run-supply-chain.mjs`, and `node tools/verify-sbom.mjs`; in the
  pull request, download the `zugfolge-ms002-evidence` artifact and compare its
  reported digest and 30-day retention with the workflow summary.

### MS-002-S07 — Prove Windows/Linux clean-checkout parity

- **Depends on:** S06.
- **Outcome:** one documented root interface executes the same named locked
  phases on explicit Ubuntu 24.04 and Windows Server 2025 runners.
- **Risk:** R3 because this slice changes CI execution and artifact flow.
- **Allowed paths:** `/.github/workflows/ci.yml`, `/tools/preflight.mjs`,
  `/tools/verify.mjs`, `/package.json`, `/pnpm-lock.yaml`,
  `/tests/cross-platform-policy.test.mjs`, `/README.md`,
  `/docs/DEVELOPMENT.md`, `/apps/data-pipeline/README.md`,
  `/apps/game-server/README.md`, `/integrations/odoo/README.md`, and
  `/.gitattributes`. The first Windows root run additionally proved three
  required compliance paths omitted from the initial allowlist:
  `/REUSE.toml`, `/tests/compliance.test.mjs`, and
  `/tests/tooling-policy.test.mjs`.
- **Forbidden:** application/domain behavior, public contracts, mutable
  `*-latest` runner labels, secrets, deployment, and production services.
- **Acceptance:** AC-001 through AC-010 pass from fresh Windows and Linux
  checkouts; wrong tool versions fail preflight; the runs modify no tracked lock
  or generated file.
- **Rollback:** remove the matrix/root orchestrator while preserving all
  ecosystem-native commands and the supply-chain workflow.
- **Observability:** toolchain inventory, phase duration/result, test/coverage
  evidence, and artifact digests without absolute user paths or environment
  dumps.
- **Verification:** on both `ubuntu-24.04` and `windows-2025`, run
  `node tools/preflight.mjs`, `node --test tests/cross-platform-policy.test.mjs`,
  `pnpm verify`, and `git diff --exit-code`; the policy test must also execute a
  child preflight with each supported tool version intentionally mismatched and
  assert the documented non-zero result.

### MS-002-S08 — Verify and close MS-002

- **Depends on:** S07.
- **Outcome:** independent evidence proves every milestone exit criterion.
- **Risk:** R0 for evidence files; exit approval remains R3.
- **Allowed paths:** `/planning/milestones.yaml`,
  `/planning/evidence/MS-002.yaml`, `/docs/ROADMAP.md`, and
  `/planning/MS-002-KICKOFF.md`.
- **Forbidden:** implementation, dependencies, workflows, contracts, and
  retroactive weakening of tests.
- **Acceptance:** a fresh Windows and Linux run is green from the exact
  candidate commit; all dependency records and approvals are current; no
  generated caches are tracked.
- **Rollback:** return status to `verifying`; never delete failed evidence.
- **Observability:** immutable links/digests in the milestone evidence manifest.
- **Verification:** from the exact candidate commit, run `pnpm verify` and
  `git diff --exit-code` in fresh Ubuntu and Windows jobs; record both run URLs,
  the commit SHA, artifact digests, rollback result, independent agent review,
  and the linked human Security Reviewer sign-off in
  `/planning/evidence/MS-002.yaml`.

## Human preparation gate

The repository owner explicitly assumed and approved the human Security
Reviewer decision on 1 August 2026. The permanent record is linked from
[S01 issue #3](https://github.com/larynxberlin-rgb/Zugfolge/issues/3#issuecomment-5150191133)
and the [coordinating issue #2](https://github.com/larynxberlin-rgb/Zugfolge/issues/2#issuecomment-5150191185).

The decision covers the exact toolchain/dependency set, bootstrap channels,
immutable Action SHAs, least-privilege permissions, runner images,
secret-scan/coverage/SBOM tooling, 30-day artifact retention, full-SHA setting,
and non-auto-merged Dependabot updates. It was made by the human owner rather
than substituted by an AI agent or test. `MS-002` moves to `in-progress` with
S01; S02–S08 remain governed by their own dependencies and acceptance gates.

## Exact checks planned for milestone exit

The accepted S01 policy may refine command spelling but MUST preserve these
checks:

```text
pnpm install --frozen-lockfile
uv sync --all-packages --locked
./gradlew --no-daemon --console=plain check
pnpm verify
```

The Windows sequence uses `gradlew.bat`; all logical verification phases and
evidence requirements remain identical.
