# ADR-0005: Polyglot build and supply-chain baseline

**Status:** Proposed\
**Date:** 2026-07-30\
**Milestone:** MS-002\
**Deciders:** Architecture Steward, Human Security Reviewer

## Context

The foundation repository has one npm-based TypeScript application, two
independent Python packages without a shared lock, and no Kotlin/JVM build.
GitHub Actions currently verifies the Node and Python foundation on Ubuntu.
The target architecture requires TypeScript, Kotlin/JVM 21, and Python to be
developed in one monorepo without allowing one ecosystem to resolve or import
another ecosystem's private implementation.

The build baseline is a supply-chain trust boundary. Package managers download
code, Gradle executes plugins, and GitHub Actions execute third-party
repositories. Mutable versions, automatic lock updates, broad token
permissions, or multiple supported installers would make AI-generated changes
hard to reproduce or review.

## Proposed decision

Subject to the required human security review, Zugfolge will use:

| Area | Decision |
|---|---|
| JavaScript runtime | official Node.js `24.18.0` LTS |
| JavaScript packages | pnpm `11.18.0`, one workspace and lock |
| Python runtime | CPython `3.13.14`, subject to current-package and planned GIS compatibility evidence |
| Python packages | uv `0.12.0`, one workspace and lock |
| JVM | Eclipse Temurin `21.0.12+8` |
| JVM build | Gradle wrapper `9.5.0` with distribution checksum and wrapper-JAR verification |
| Kotlin | Kotlin JVM plugin `2.4.10` |
| JVM tests | JUnit BOM/Jupiter `6.1.2` |
| Linux CI | `ubuntu-24.04` |
| Windows CI | `windows-2025` |

Gradle `9.5.0`, rather than the newer `9.6.1`, is proposed because Kotlin
`2.4.10` documents full Gradle support only through `9.5.0`. The version may be
raised only after the Kotlin compatibility matrix covers it.

CPython `3.13.14`, rather than the source-only `3.12.13` security release, is
proposed because Python.org publishes both source and signed Windows artifacts
for the exact release. S01 must still prove that both current packages and the
planned GDAL/osmium/Polars toolchain support this line before accepting it.

The existing web application will stay at the repository root during MS-002.
Moving it to `apps/web` would mix a hosting/layout migration with the
package-manager migration and is not required to prove explicit package
boundaries.

The existing tracked `/build` directory contains TypeScript hosting source.
Gradle output MUST use a distinct generated root such as `/.gradle-build`; the
Gradle default MUST NOT overwrite or cause `/build` to be ignored.

### Bootstrap

Local developers may install the pinned pnpm through an official pnpm method.
CI will use the reviewed, SHA-pinned `pnpm/action-setup` release and MUST NOT
depend on Corepack being bundled with Node. Corepack is experimental, is not
bundled with newer Node releases, and has had stale-signature failures.

uv will be installed through a version-addressable official distribution
locally and a reviewed, SHA-pinned `astral-sh/setup-uv` Action in CI.

The Gradle wrapper scripts, wrapper JAR, distribution URL, and distribution
checksum will be committed. CI and repository tests will verify both official
Gradle checksums before executing the build. A system Gradle installation is
not supported.

### Dependency and Action integrity

- TypeScript and Python installs use frozen locks.
- Gradle uses dependency locking and strict dependency verification.
- Every direct dependency has a purpose, license, official source, trust
  boundary, owner, and rollback record.
- Every external Action uses a full 40-character commit SHA and a release
  comment.
- Default workflow permissions are `contents: read`; exceptional permissions
  are job-local and documented.
- Repository enforcement of full-SHA Action pins is recommended, subject to
  the human security decision.

### SBOM

The proposed CycloneDX path is:

- TypeScript: the native pnpm SBOM command;
- Python: `cyclonedx-bom` `7.3.1` against the frozen synchronized environment;
- JVM: `org.cyclonedx.bom` Gradle plugin `3.3.0`;
- optional validation/merge: CycloneDX CLI `0.33.1` only if review shows a
  combined document is needed.

The first baseline will retain three ecosystem-specific CycloneDX JSON
documents in one artifact. It will not introduce an unreviewed dependency-
submission Action merely to obtain a combined view.

### Coverage, secrets, and evidence retention

- Node.js uses its built-in test coverage as the initial JavaScript coverage
  foundation; a new JavaScript coverage package is not introduced in MS-002.
- Python uses `coverage.py` `7.15.2` (Apache-2.0).
- Kotlin/JVM uses JaCoCo `0.8.15` (EPL-2.0).
- Secret scanning uses the Gitleaks `8.30.1` CLI (MIT) from its official
  checksummed release artifacts. An Action wrapper is not required.
- Test, coverage, and CycloneDX workflow artifacts are retained for 30 days.
  Permanent milestone evidence records commit and artifact digests rather than
  claiming that a temporary CI artifact is archival storage.

Dependabot may open weekly pull requests for GitHub Action and package-manager
updates, but MUST NOT auto-merge them. Full-SHA Action enforcement at repository
level remains recommended.

## Options considered

### Keep npm, independent Python environments, and system Gradle

Rejected because it does not meet the explicit `MS-002` outcome, creates
different local and CI resolution paths, and cannot prove a single
fresh-checkout workflow.

### Use Corepack as the only pnpm bootstrap

Rejected as the CI baseline because Corepack availability changes across Node
releases and its signature metadata has caused installation failures. It may
remain a documented local option after its own version is pinned.

### Use Gradle 9.6.1 immediately

Rejected for the initial baseline because it is newer than Kotlin `2.4.10`'s
fully supported Gradle range. This can be revisited without changing the
architecture.

### Move the browser to `apps/web` during the migration

Rejected for MS-002 because it expands rollback and affects the connected site
build without improving package resolution or JVM/Python reproducibility.

### Introduce Docker as the common developer environment

Rejected because MS-002 must prove native Windows and Linux workflows and the
Walking Skeleton does not yet require a runtime service. Containers remain a
later deployment decision.

## Consequences

- The repository gains three locks/verification roots with one documented
  orchestrator, rather than pretending one package manager owns every language.
- Toolchain upgrades become explicit dependency-policy changes with review and
  fresh-checkout evidence.
- Windows CI adds cost and latency but catches path, shell, line-ending, and
  executable-bit failures before product code depends on them.
- `.gitattributes` must define stable Gradle wrapper line endings.
- Python tests must import installed workspace packages instead of modifying
  `sys.path`.
- The current license test, which reads npm lock metadata directly, must be
  replaced with an ecosystem-neutral dependency report before
  `package-lock.json` is removed.
- No production service, public contract, game behavior, or persistence format
  changes.

## Approval conditions

This ADR remains `Proposed`. Before it may become `Accepted`, the human Security
Reviewer MUST:

1. approve CPython `3.13.14` after current-package and planned GIS compatibility
   evidence, including the official Windows artifact and integrity record;
2. approve the proposed Eclipse Temurin `21.0.12+8` distribution and its
   platform checksums;
3. verify each proposed tool, plugin, Action SHA, official checksum, and license;
4. approve Gitleaks `8.30.1`, built-in Node coverage, coverage.py `7.15.2`,
   JaCoCo `0.8.15`, 30-day artifact retention, and workflow permissions;
5. decide whether full-SHA Action enforcement and automated Action updates are
   enabled in repository settings.
