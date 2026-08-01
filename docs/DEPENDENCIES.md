# Dependency and supply-chain register

**Status:** MS-002 preparation
**Last reviewed:** 2026-07-30

This register explains why build and CI dependencies execute, where they come
from, and how they are pinned and removed. It does not relicense dependencies.
Zugfolge's own file-level matrix is recorded in
[`REUSE.toml`](../REUSE.toml), while wider `MS-001` rights review remains open.

Entries marked **candidate** are not approved or installed. They require the
human Security Reviewer named by `MS-002` before an implementation slice may
add them.

## Policy

- Runtime, build, test, package-manager, scanner, and CI dependencies MUST have
  an exact lock or immutable commit.
- GitHub Actions MUST use full 40-character commit SHAs with a release comment.
- A dependency entry MUST identify purpose, license, official source, trust
  boundary, update method, and rollback.
- Registry and installer code is untrusted input. CI uses locked/frozen modes
  and least-privilege permissions.
- A newer version is not automatically safer or compatible. Updates require
  compatibility, license, checksum, and fresh-checkout evidence.
- No package in this register authorizes a production provider or platform
  service. Those services are introduced only by the milestones in
  [SERVICES.md](SERVICES.md).

## Current foundation

The current TypeScript dependency graph is exactly recorded by
`package-lock.json`; direct purposes are visible in `package.json` and license
metadata is enforced by `tests/repository-policy.test.mjs`. The lock remains
authoritative until `MS-002-S02` replaces both it and that license check in the
same reviewed slice.

Both current Python packages have no runtime dependency. Their pinned
`hatchling==1.27.0` build backend is a build-time dependency. They do not yet
share a resolved lock.

The current web production dependency closure is `react`, `react-dom`, and
`scheduler`. The emitted browser/server artifact also carries code or generated
output associated with `react-server-dom-webpack`, Tailwind CSS, Vinext,
Rolldown, and Vite. The deterministic
[`generate-third-party-notices.mjs`](../scripts/generate-third-party-notices.mjs)
collects their exact installed license files into the shipped
[`THIRD-PARTY-NOTICES.txt`](../public/legal/THIRD-PARTY-NOTICES.txt). CI fails
when that file is stale, missing from `dist`, or when native/build-only
artifacts leak into the client distribution. This reviewed set must be
re-evaluated whenever bundling or dependencies change; it is not a permanent
allowlist.

Current workflows use only immutable Action SHAs:

| Action | Current release | Purpose | Permission/trust boundary |
|---|---|---|---|
| `actions/checkout` | v5 | materialize repository source | untrusted PR source; `contents: read` |
| `actions/setup-node` | v5 | install/cache the declared Node runtime | downloads official Node distribution; `contents: read` |
| `actions/setup-python` | v6 | install the declared Python runtime | downloads official Python distribution; `contents: read` |
| `github/codeql-action` | v3 | initialize, build, and upload SAST results | job-local `security-events: write` |
| `actions/dependency-review-action` | pinned main commit | reject vulnerable dependency deltas | pull requests only; `contents: read`; Dependency Graph required |

All current Action references remain unchanged in the MS-002 preparation pull
request.

## Proposed MS-002 toolchains

| Dependency | Candidate | Purpose | License | Official source | Trust/update/rollback |
|---|---|---|---|---|---|
| Node.js | `24.18.0` LTS | TypeScript runtime and root verifier | MIT | [Node.js release](https://nodejs.org/en/blog/release/v24.18.0) | official binary/checksum; update as isolated toolchain slice; roll back pin and lock together |
| pnpm | `11.18.0` | JavaScript workspace and frozen dependency resolution | MIT | [pnpm release](https://github.com/pnpm/pnpm/releases/tag/v11.18.0) | exact `packageManager` plus lock; no floating `latest`; restore npm lock on rollback |
| CPython | `3.13.14` | data-pipeline and Odoo-bridge runtime | PSF-2.0 | [Python release](https://www.python.org/downloads/release/python-31314/) | official source plus signed Windows installer are available; adopt only after current-package and planned GIS compatibility checks |
| uv | `0.12.0` | Python workspace, environment, build and lock | MIT OR Apache-2.0 | [uv releases](https://github.com/astral-sh/uv/releases) | exact installer/Action version; frozen workspace lock; remove root workspace on rollback |
| Eclipse Temurin | `21.0.12+8` | Kotlin compiler/runtime toolchain | GPL-2.0-only WITH Classpath-exception-2.0 | [official release](https://github.com/adoptium/temurin21-binaries/releases/tag/jdk-21.0.12%2B8) | human reviewer verifies the platform artifacts/checksums; no approval yet |
| Gradle wrapper | `9.5.0` | Kotlin multi-project build | Apache-2.0 | [Gradle distributions](https://services.gradle.org/versions/all) | distribution SHA-256 plus wrapper-JAR SHA-256; wrapper fully tracked; remove additive build on rollback |
| Kotlin JVM plugin | `2.4.10` | Kotlin compilation | Apache-2.0 | [Kotlin releases](https://kotlinlang.org/docs/releases.html) | Gradle dependency verification; 9.5 is the newest fully supported Gradle version |
| JUnit Jupiter/BOM | `6.1.2` | JVM tests | EPL-2.0 | [JUnit 6.1.2](https://docs.junit.org/6.1.2/overview.html) | Gradle lock/verification; remove test-only dependency on rollback |

Proposed official Gradle checksums for `9.5.0`:

- distribution SHA-256:
  `553c78f50dafcd54d65b9a444649057857469edf836431389695608536d6b746`;
- wrapper JAR SHA-256:
  `497c8c2a7e5031f6aa847f88104aa80a93532ec32ee17bdb8d1d2f67a194a9c7`.

They MUST be independently checked against the
[Gradle checksum page](https://gradle.org/release-checksums/) during S04.

## Proposed CI Actions

All candidates below are MIT-licensed and execute in the CI trust boundary.
The human security review MUST verify that every SHA belongs to the named
official repository and release before use.

| Action | Candidate immutable reference | Purpose and permission |
|---|---|---|
| `actions/checkout` | `3d3c42e5aac5ba805825da76410c181273ba90b1` (`v7.0.1`) | checkout; `contents: read` |
| `actions/setup-node` | `820762786026740c76f36085b0efc47a31fe5020` (`v7.0.0`) | exact Node runtime/cache; `contents: read` |
| `actions/setup-java` | `03ad4de0992f5dab5e18fcb136590ce7c4a0ac95` (`v5.6.0`) | exact JDK distribution; `contents: read` |
| `actions/setup-python` | `5fda3b95a4ea91299a34e894583c3862153e4b97` (`v7.0.0`) | exact Python runtime; `contents: read` |
| `pnpm/action-setup` | `0ebf47130e4866e96fce0953f49152a61190b271` (`v6.0.9`) | exact pnpm CLI; `contents: read` |
| `astral-sh/setup-uv` | `c771a70e6277c0a99b617c7a806ffedaca235ff9` (`v9.0.0`) | exact uv CLI/cache; `contents: read` |
| `actions/upload-artifact` | `043fb46d1a93c77aae656e7c1c64a875d1fc6a0a` (`v7.0.1`) | upload test/coverage/SBOM evidence; `actions: write` is not required |
| `actions/dependency-review-action` | `a1d282b36b6f3519aa1f3fc636f609c47dddb294` (`v5.0.0`) | dependency delta policy; pull request and `contents: read` only |
| `github/codeql-action` | `f205ea1c3313d32999d8d6a48b4f6530d4437b38` (`v4.37.4`) | SAST; only analyze job receives `security-events: write` |

The proposed Action majors require a sufficiently current GitHub Actions
runner. S07 therefore uses explicit `ubuntu-24.04` and `windows-2025` hosted
images and records their image versions in job evidence.

## Proposed CycloneDX tooling

| Ecosystem | Candidate | License | Use |
|---|---|---|---|
| pnpm | native `pnpm sbom` | part of pnpm, MIT | produce the resolved JavaScript CycloneDX document |
| Python | `cyclonedx-bom==7.3.1` | Apache-2.0 | produce CycloneDX JSON from the frozen synchronized environment |
| Gradle | `org.cyclonedx.bom` `3.3.0` | Apache-2.0 | produce the JVM CycloneDX document |
| Cross-ecosystem | CycloneDX CLI `0.33.1`, optional | Apache-2.0 | validate and merge only if review requires one combined document |

The baseline retains three ecosystem-specific documents in one artifact.
GitHub's own export is SPDX, and a third-party dependency-submission Action is
not added merely to obtain another view.

## Proposed coverage, secret scan, and retention

| Tool | Candidate | License | Purpose and trust boundary |
|---|---|---|---|
| Node.js test coverage | built into Node `24.18.0` | MIT | initial machine-readable JavaScript test coverage without another package |
| coverage.py | `7.15.2` | Apache-2.0 | Python branch/line coverage from the locked uv environment |
| JaCoCo | `0.8.15` | EPL-2.0 | JVM branch/line coverage through verified Gradle dependencies |
| Gitleaks CLI | `8.30.1` | MIT | scan worktree and Git history from official checksummed release binaries |

Test, coverage, and CycloneDX artifacts are proposed to use
`retention-days: 30`. Their SHA-256 artifact digests enter milestone evidence;
the temporary artifact itself is not treated as permanent archive storage.

## Decisions still blocking implementation

- platform artifacts/checksums for the proposed Temurin `21.0.12+8` build;
- confirmation that every current Python package and the planned GIS toolchain
  support the proposed cross-platform CPython `3.13.14` baseline;
- checksum/trust review for the proposed coverage, Gitleaks, and CycloneDX
  tooling;
- approval of the proposed 30-day artifact retention;
- whether the repository setting requiring full-SHA Action pins is enabled;
- whether Dependabot may open non-auto-merged weekly update pull requests;
- complete license/trust review for the proposed candidates.

The approved decisions are recorded here, in `ADR-0005`, and in the MS-002
coordinating issue before `FEAT-0002` becomes `Accepted`.
