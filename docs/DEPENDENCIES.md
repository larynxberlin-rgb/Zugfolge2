# Dependency and supply-chain register

**Status:** MS-002-S02 JavaScript lock candidate; later ecosystems remain policy-only
**Last reviewed:** 2026-08-01
**Security approval:** accepted — [human decision record](https://github.com/larynxberlin-rgb/Zugfolge/issues/3#issuecomment-5150191133)

This register explains why build and CI dependencies execute, where they come
from, and how they are pinned and removed. It does not relicense dependencies.
Zugfolge's own file-level matrix is recorded in
[`REUSE.toml`](../REUSE.toml), while wider `MS-001` rights review remains open.

Policy pins below are approved but not thereby installed. Each owning slice
must add the exact dependency and its lock/checksum evidence atomically, pass
the listed verification, and retain a direct rollback.

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

The TypeScript dependency graph is exactly recorded by `pnpm-lock.yaml` and
requires Node.js `24.18.0` plus pnpm `11.18.0`. Direct purposes remain visible
in `package.json`; direct installed licenses are checked independently of a
package-manager-specific lockfile field, while the shipped package set is
verified against installed metadata, lock integrity and exact notice bytes.
`package-lock.json` and npm project-resolution commands are no longer accepted.

Both current Python packages have no runtime dependency. Their pinned
`hatchling==1.27.0` build backend is a build-time dependency. They do not yet
share a resolved lock.

The current web production dependency closure is `react`, `react-dom`, and
`scheduler`. The emitted browser/server artifact also carries code or generated
output associated with `react-server-dom-webpack`, Tailwind CSS, Vinext,
`@vitejs/plugin-rsc`, Rolldown, and Vite. The deterministic
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
| `actions/setup-node` | v7.0.0 | install/cache Node.js `24.18.0` | downloads official Node distribution; `contents: read` |
| `pnpm/action-setup` | v6.0.9 | install pnpm `11.18.0` | executes only in the existing web job; `contents: read` |
| `actions/setup-python` | v6 | install the declared Python runtime | downloads official Python distribution; `contents: read` |
| `github/codeql-action` | v3 | initialize, build, and upload SAST results | job-local `security-events: write` |
| `actions/dependency-review-action` | pinned main commit | reject vulnerable dependency deltas | pull requests only; `contents: read`; Dependency Graph required |

S02 changes only the existing web job to the approved setup-node and pnpm
references. Python and security workflows remain unchanged until their owning
slices.

### S02 advisory disposition

The S02 candidate replaces the vulnerable graph with exact React and
`react-server-dom-webpack` `19.2.8`, Vite `8.2.0`,
`@cloudflare/vite-plugin` `1.50.0`, and Wrangler `4.118.0` pins. A frozen pnpm
audit on 1 August 2026 reports zero known Low, Moderate, High, or Critical
findings across 430 resolved dependencies. No force-update or advisory
suppression is used. Public deployment remains independently blocked by the
asset-provenance gate.

pnpm 11 applies its default 24-hour release-age quarantine. The exact
Cloudflare plugin and Wrangler security updates, plus their locked Miniflare
alpha dependency, are explicit `minimumReleaseAgeExclude` entries because they
were reviewed and intentionally selected before aging out. Lifecycle scripts
are denied by default; only the locked `esbuild@0.28.1` and
`workerd@1.20260730.1` installers required by the existing build are allowed.
Removing those exceptions or reverting the dependency pins and pnpm lock is
the S02 rollback.

## Approved MS-002 toolchains

| Dependency | Policy pin | Purpose | License | Official source | Trust/update/rollback |
|---|---|---|---|---|---|
| Node.js | `24.18.0` LTS | TypeScript runtime and root verifier | MIT | [Node.js release](https://nodejs.org/en/blog/release/v24.18.0) | official binary/checksum; update as isolated toolchain slice; roll back pin and lock together |
| pnpm | `11.18.0` | JavaScript workspace and frozen dependency resolution | MIT | [pnpm release](https://github.com/pnpm/pnpm/releases/tag/v11.18.0) | exact `packageManager` plus lock; no floating `latest`; restore npm lock on rollback |
| CPython | `3.13.14` | data-pipeline and Odoo-bridge runtime | PSF-2.0 | [Python release](https://www.python.org/downloads/release/python-31314/) | official source plus signed Windows installer; interpreter compatibility accepted below |
| uv | `0.12.0` | Python workspace, environment, build and lock | MIT OR Apache-2.0 | [uv releases](https://github.com/astral-sh/uv/releases) | exact installer/Action version; frozen workspace lock; remove root workspace on rollback |
| Eclipse Temurin | `21.0.12+8` | Kotlin compiler/runtime toolchain | GPL-2.0-only WITH Classpath-exception-2.0 | [official release](https://github.com/adoptium/temurin21-binaries/releases/tag/jdk-21.0.12%2B8) | exact Linux/Windows artifacts below; isolated pin update and wrapper rollback |
| Gradle wrapper | `9.5.0` | Kotlin multi-project build | Apache-2.0 | [Gradle distributions](https://services.gradle.org/versions/all) | distribution SHA-256 plus wrapper-JAR SHA-256; wrapper fully tracked; remove additive build on rollback |
| Kotlin JVM plugin | `2.4.10` | Kotlin compilation | Apache-2.0 | [Kotlin releases](https://kotlinlang.org/docs/releases.html) | Gradle dependency verification; 9.5 is the newest fully supported Gradle version |
| JUnit Jupiter/BOM | `6.1.2` | JVM tests | EPL-2.0 | [JUnit 6.1.2](https://docs.junit.org/6.1.2/overview.html) | Gradle lock/verification; remove test-only dependency on rollback |

Approved bootstrap channels:

- local pnpm: install exact `pnpm@11.18.0` from the official npm registry
  after the pinned Node.js runtime, verify registry integrity
  `sha512-M9g8d9qC9J+6g2klxvG4QRgewxMrZwY5vQEvcHX1x89jTF+HAUfBmq50ePrAHfCdiJLogEVIlu3SPumzN1dWPA==`,
  then verify `pnpm --version` before use;
- CI pnpm: the immutable `pnpm/action-setup` reference below;
- local uv: the version-addressable official `0.12.0` installer, with the
  downloaded platform artifact verified against the approved digest below;
- CI uv: the immutable `astral-sh/setup-uv` reference below;
- Gradle: only the committed, checksum-verified wrapper; no system Gradle.

Corepack is not the CI trust root and an unversioned remote install script is
not an accepted bootstrap path.

Approved official Gradle checksums for `9.5.0`:

- distribution SHA-256:
  `553c78f50dafcd54d65b9a444649057857469edf836431389695608536d6b746`;
- wrapper JAR SHA-256:
  `497c8c2a7e5031f6aa847f88104aa80a93532ec32ee17bdb8d1d2f67a194a9c7`.

They MUST be independently checked against the
[Gradle checksum page](https://gradle.org/release-checksums/) during S04.

### Approved cross-platform integrity evidence

| Artifact | Approved SHA-256 |
|---|---|
| Node.js `node-v24.18.0-linux-x64.tar.xz` | `55aa7153f9d88f28d765fcdad5ae6945b5c0f98a36881703817e4c450fa76742` |
| Node.js `node-v24.18.0-win-x64.zip` | `0ae68406b42d7725661da979b1403ec9926da205c6770827f33aac9d8f26e821` |
| CPython `Python-3.13.14.tar.xz` | `639e43243c620a308f968213df9e00f2f8f62332f7adbaa7a7eeb9783057c690` |
| CPython `python-3.13.14-amd64.exe` | `c54d9b9bbb8a36e6489363ddd01139707fd781d72f1f9e90c7ec65d0061368e0` |
| Temurin `OpenJDK21U-jdk_x64_linux_hotspot_21.0.12_8.tar.gz` | `e4446ff06a276155697597cc0f1b15da004ff083f4964a35271ecee567177370` |
| Temurin `OpenJDK21U-jdk_x64_windows_hotspot_21.0.12_8.zip` | `9ba963ee2371874a74185d18bc7bb2ab9407df7683300855ed7606e0662321d0` |
| uv `uv-x86_64-unknown-linux-gnu.tar.gz` | `eaf842262aa1c418d8ecc5605f02ee1ebfd369124fa48548e85f9481a47831a9` |
| uv `uv-x86_64-pc-windows-msvc.zip` | `68200e25de594df92387186bbfb9d9df606ec1d87efaa0ae0c7f690970e53db6` |
| Gitleaks `gitleaks_8.30.1_linux_x64.tar.gz` | `551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb` |
| Gitleaks `gitleaks_8.30.1_windows_x64.zip` | `d29144deff3a68aa93ced33dddf84b7fdc26070add4aa0f4513094c8332afc4e` |

The Node and CPython values come from their official release checksum tables;
the GitHub-hosted Temurin, uv, and Gitleaks assets expose the matching release
digests. S04 independently verifies both Gradle checksums before wrapper use.

### CPython 3.13 compatibility decision

- Current `hatchling==1.27.0` declares Python `>=3.8` and is pure Python.
- osmium `4.3.1` declares Python 3.13 support and publishes CPython 3.13
  Windows and Linux wheels.
- Polars `1.43.1` declares Python 3.13 support; its runtime uses `cp310-abi3`
  Windows and Linux wheels compatible with CPython 3.13.
- GDAL `3.13.2` declares Python `>=3.8` but ships source rather than official
  Windows wheels. Its native library/distribution is therefore not introduced
  by `MS-002`; the first GIS-consuming source milestone must approve and pin
  that native boundary separately.

This evidence accepts CPython `3.13.14` for the service-free engineering
baseline without pretending that it approves a future GDAL deployment.

## Approved CI Actions

All entries below are MIT-licensed and execute in the CI trust boundary. On
1 August 2026, every release tag was resolved through the official repository;
annotated tags were peeled to their target commits before comparing the SHA.

| Action | Approved immutable reference | Purpose and permission |
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

The approved Action majors require a sufficiently current GitHub Actions
runner. S07 therefore uses explicit `ubuntu-24.04` and `windows-2025` hosted
images and records their image versions in job evidence.

The repository currently reports `sha_pinning_required: false`. The human
decision requires enabling that setting before S06 is accepted when the GitHub
repository supports it; the repository policy test remains mandatory even when
the setting is enabled. S06 may add weekly Dependabot update pull requests but
MUST NOT enable auto-merge.

## Approved CycloneDX tooling

| Ecosystem | Approved tool | License | Use |
|---|---|---|---|
| pnpm | native `pnpm sbom` | part of pnpm, MIT | produce the resolved JavaScript CycloneDX document |
| Python | `cyclonedx-bom==7.3.1` | Apache-2.0 | produce CycloneDX JSON from the frozen synchronized environment |
| Gradle | `org.cyclonedx.bom` `3.3.0` | Apache-2.0 | produce the JVM CycloneDX document |

The baseline retains three ecosystem-specific documents in one artifact.
GitHub's own export is SPDX, and a third-party dependency-submission Action is
not added merely to obtain another view. No cross-ecosystem CycloneDX CLI is
approved for `MS-002`.

## Approved coverage, secret scan, and retention

| Tool | Approved version | License | Purpose and trust boundary |
|---|---|---|---|
| Node.js test coverage | built into Node `24.18.0` | MIT | initial machine-readable JavaScript test coverage without another package |
| coverage.py | `7.15.2` | Apache-2.0 | Python branch/line coverage from the locked uv environment |
| JaCoCo | `0.8.15` | EPL-2.0 | JVM branch/line coverage through verified Gradle dependencies |
| Gitleaks CLI | `8.30.1` | MIT | scan worktree and Git history from official checksummed release binaries |

Test, coverage, and CycloneDX artifacts use
`retention-days: 30`. Their SHA-256 artifact digests enter milestone evidence;
the temporary artifact itself is not treated as permanent archive storage.

## Approved security decisions

- exact runner and toolchain pins: approved;
- cross-platform CPython and Temurin artifacts/checksums: approved;
- pnpm and uv bootstrap channels: approved;
- coverage, Gitleaks, and ecosystem CycloneDX tools/licenses: approved;
- 30-day temporary artifact retention plus permanent digests: approved;
- immutable Action SHAs and least-privilege permissions: approved;
- repository full-SHA enforcement before S06 when supported: required;
- weekly non-auto-merged Dependabot update pull requests in S06: approved.

The decision is recorded here, in accepted `FEAT-0002` and `ADR-0005`, on
[S01 issue #3](https://github.com/larynxberlin-rgb/Zugfolge/issues/3#issuecomment-5150191133),
and from the [MS-002 coordinating issue](https://github.com/larynxberlin-rgb/Zugfolge/issues/2#issuecomment-5150191185).
