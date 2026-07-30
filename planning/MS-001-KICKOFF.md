# MS-001 kickoff: rights, license, brand, and source clearance

**Milestone state:** `ready`

**Preparation state:** complete when Slice S01 is merged

**Implementation state:** blocked at the owner/legal gate

**Risk:** R3

**Authoritative milestone:** `planning/milestones.yaml#MS-001`

**Proposed feature:** `FEAT-0003`

**Accepted dependencies:** `MS-000`, `CONST-006`, `CONST-012`, `ADR-0003`

## Outcome and boundary

MS-001 establishes ownership, licensing, contribution, brand, domain, asset,
source, service, and initial privacy decisions needed through `RG-4`. It also
records later Full Release source gates, especially `MS-039`, without pretending
that a deferral is an approval.

The repository remains `UNLICENSED`, external contributions remain closed, and
all source approvals remain blocked until accountable humans sign the required
decisions. This kickoff is an executable work contract, not legal advice.

## Repository evidence at kickoff

- No root `LICENSE`, `NOTICE`, contributor policy, DCO/CLA, rights-holder
  decision, asset register, or approved source register existed at discovery.
- Package metadata and tests deliberately enforce `UNLICENSED`.
- Current assets and synthetic fixtures lack complete private creation and
  rights-transfer evidence.
- Public OSM/ORM services, Trassenfinder, pathOS/TPN, RINF, tariff publications,
  and realistic disruption feeds have materially different use rights.
- The current demo uses a connected external hosting descriptor, but the target
  service map previously described only the future platform.
- MS-002 is being prepared in parallel. Final license and dependency evidence
  must therefore run against the integrated current `main` candidate.

## Blocking human decisions

The project owner must answer and record:

1. May third parties operate public commercial forks if network-copyleft duties
   are met?
2. Who is the natural or legal licensor, trademark owner, domain owner, and
   contracting party?
3. Is the core license candidate `AGPL-3.0-or-later`,
   `AGPL-3.0-only`, `EUPL-1.2`, or proprietary?
4. Are contracts/SDKs Apache-2.0 and documentation CC-BY-4.0 acceptable?
5. Is future proprietary/OEM dual licensing a real requirement?
6. Will contributions use DCO with inbound-equals-outbound, or does dual
   licensing require a qualified CLA before the first external contribution?
7. Which existing commits, AI-assisted outputs, assets, and fixtures can the
   rights holder validly license?
8. Which trademark classes, territories, owner, fallback name, and filing
   strategy apply?

Qualified reviewers must separately approve:

- software and contribution licensing;
- data and ODbL layer design;
- trademark and domain clearance;
- privacy and external processing;
- dependency, font, image, sound, and other asset obligations.

## Delivery graph

```text
S01 preparation and machine-readable blockers
  → S02 ownership, AI provenance, and contribution model
      ├─→ S03 license mosaic
      ├─→ S04 assets and dependencies
      ├─→ S05 brand and domain
      └─→ S06 OSM and synthetic pilot sources
              → S07 remaining RG-4 sources, services, and privacy
                    → S08 integrated-main exit evidence
```

Every slice is a separate pull request unless a human reviewer explicitly
approves a smaller grouping. No implementation agent may approve its own work.

## GitHub execution map

- [MS-001 milestone](https://github.com/larynxberlin-rgb/Zugfolge/milestone/2)
- [#12 coordinator](https://github.com/larynxberlin-rgb/Zugfolge/issues/12)
- [#13 S01 preparation](https://github.com/larynxberlin-rgb/Zugfolge/issues/13)
- [#14 S02 ownership and contributions](https://github.com/larynxberlin-rgb/Zugfolge/issues/14)
- [#15 S03 license mosaic](https://github.com/larynxberlin-rgb/Zugfolge/issues/15)
- [#16 S04 assets and dependencies](https://github.com/larynxberlin-rgb/Zugfolge/issues/16)
- [#17 S05 brand and domain](https://github.com/larynxberlin-rgb/Zugfolge/issues/17)
- [#18 S06 OSM and synthetic pilot](https://github.com/larynxberlin-rgb/Zugfolge/issues/18)
- [#19 S07 RG-4 sources, services, privacy](https://github.com/larynxberlin-rgb/Zugfolge/issues/19)
- [#20 S08 integrated exit evidence](https://github.com/larynxberlin-rgb/Zugfolge/issues/20)

## S01 — Preparation register and enforce blockers

**Result:** Proposed `FEAT-0003`, a schema-validated preparation register, source
risk memo, privacy baseline, service disclosure, and truthful synthetic-demo
label exist. No right or provider is approved.

**Risk:** R2

**Allowed paths:**

```text
compliance/**
docs/legal/**
docs/LICENSING.md
docs/SERVICES.md
docs/README.md
TRADEMARKS.md
CONTRIBUTING.md
README.md
PLAN.md
spec/README.md
spec/features/FEAT-0003-rights-license-and-source-clearance.md
planning/MS-001-KICKOFF.md
planning/milestones.yaml
planning/README.md
app/components/OperationsConsole.tsx
tests/ms001-preparation.test.mjs
tests/rendered-html.test.mjs
```

**Forbidden:** adding `LICENSE`/`NOTICE`; changing package license metadata;
accepting contributions; registering or claiming ownership of a domain or mark;
provider calls; source imports; live data; private evidence.

**Acceptance:**

- Given preparation state, when tests run, then root license remains
  `UNLICENSED`, external contributions are closed, and no source/asset is
  approved.
- Given every registered source, when JSON Schema validation runs, then required
  permission, expiry, failure, fallback, withdrawal, and owner fields exist.
- Given excluded public services and systems, when policy checks run, then their
  exclusions and own/self-hosted fallbacks are explicit.
- Given the UI fixture, when rendered, then it says that current data is
  synthetic and that no OSM data is loaded.

**Rollback:** delete the preparation artifacts and revert the truthful demo
label; no external right, license, import, or service state changes.

**Observability:** CI prints safe record IDs and validation failures only.

**Verification:**

```text
node --test tests/ms001-preparation.test.mjs tests/repository-policy.test.mjs tests/roadmap.test.mjs
npm run lint
npm test
```

**Gate:** independent repository review; no legal approval is implied.

## S02 — Establish ownership, AI provenance, and contribution model

**Result:** The authorized rights holder and rights chain are privately
evidenced; public records contain safe references/digests; AI-assisted work is
reviewed; one contribution model is selected. Contributions stay closed until
all required files and branch protections are active.

**Risk:** R3

**Allowed paths:**

```text
compliance/rights-register.yaml
compliance/ownership.yaml
docs/legal/OWNERSHIP.md
docs/legal/AI-PROVENANCE.md
CONTRIBUTING.md
DCO.txt
CLA.md
.github/pull_request_template.md
.github/ISSUE_TEMPLATE/**
tests/rights-policy.test.mjs
README.md
```

Only one of `DCO.txt` or `CLA.md` may become operative. A draft alternative may
exist only when visibly marked non-operative.

**Forbidden:** personal identity documents; signatures; employment or
contractor contracts; confidential legal advice; automatic copyright claims
for unreviewed AI output; retroactive assertions unsupported by evidence.

**Acceptance:**

- Given every material prior contribution, when the rights review runs, then it
  maps to an authorized rights holder or is removed/replaced.
- Given an external contribution, when the chosen policy is not fully active,
  then the contribution is rejected without silently accepting rights.
- Given AI assistance, when a contributor submits work, then human review and
  required-rights assertions are explicit.

**Rollback:** prospective contribution intake may be closed immediately;
historical contributor statements and evidence are never overwritten.

**Observability:** CI reports missing sign-off or policy state without exposing
private evidence.

**Verification:**

```text
node --test tests/rights-policy.test.mjs tests/repository-policy.test.mjs
npm test
```

**Gate:** project owner, identified rights holder, and qualified
software-license counsel.

## S03 — Apply the owner-approved license mosaic

**Result:** Code, public contracts/SDKs, documentation, original fixtures,
OSM-derived data, brands, and commercial assets have explicit, non-conflicting
rules. The first licensed commit is permanently recorded.

**Risk:** R3

**Allowed paths:**

```text
LICENSE
LICENSES/**
NOTICE
REUSE.toml
docs/LICENSING.md
docs/legal/LICENSE-DECISION.md
TRADEMARKS.md
README.md
package.json
package-lock.json
pnpm-lock.yaml
pnpm-workspace.yaml
apps/**/package.json
packages/**/package.json
apps/**/pyproject.toml
integrations/**/pyproject.toml
apps/*/build.gradle.kts
tests/repository-policy.test.mjs
tests/rendered-html.test.mjs
app/components/OperationsConsole.tsx
app/layout.tsx
compliance/rights-register.yaml
```

**Forbidden:** selecting a license in code without the signed owner/legal
decision; placing third-party data or brand assets under the code license;
claiming that later removal revokes licenses already received; weakening tests
to tolerate inconsistent metadata.

**Acceptance:**

- Given the approved decision, when license tests run, then every component and
  package has the exact SPDX identifier and notice required for its scope.
- Given the official web service, when rendered, then users can reach the
  corresponding source for the deployed version where the selected license
  requires it.
- Given a failed atomic license update, then the candidate does not merge and
  the last integrated state remains explicitly `UNLICENSED`.

**Rollback:** before merge, revert atomically. After a licensed commit has been
distributed, changes are prospective only and the prior grant remains recorded.

**Observability:** SBOM/license output records SPDX IDs, obligations, exceptions,
and first licensed commit; it contains no private legal advice.

**Verification:**

```text
pnpm verify
node tools/run-supply-chain.mjs
node tools/verify-sbom.mjs
git diff --check
git diff --exit-code -- LICENSE LICENSES NOTICE REUSE.toml package.json pnpm-lock.yaml
```

**Gate:** project owner, rights holder, qualified license counsel, and
independent dependency reviewer.

## S04 — Clear assets and dependencies

**Result:** Every tracked brand asset, font, illustration, sound, fixture,
runtime dependency, build dependency, CI action, and container has provenance,
license compatibility, required notices, and a drift detector, or is replaced.

**Risk:** R3

**Allowed paths:**

```text
compliance/assets.yaml
compliance/dependencies.yaml
compliance/rights-register.yaml
docs/legal/THIRD-PARTY-NOTICES.md
LICENSES/**
NOTICE
public/favicon.svg
public/og.png
public/fonts/**
public/media/**
app/components/BlockZ.tsx
app/globals.css
app/layout.tsx
package.json
pnpm-lock.yaml
pyproject.toml
uv.lock
build.gradle.kts
gradle/libs.versions.toml
gradle/verification-metadata.xml
gradle.lockfile
apps/*/package.json
apps/*/pyproject.toml
apps/*/build.gradle.kts
apps/*/gradle.lockfile
apps/*/Dockerfile
packages/*/package.json
integrations/*/package.json
integrations/*/pyproject.toml
integrations/*/Dockerfile
.github/workflows/ci.yml
.github/workflows/security.yml
.github/workflows/supply-chain.yml
tests/compliance.test.mjs
tests/repository-policy.test.mjs
```

**Forbidden:** unreviewed generated assets; remote font CDNs; unknown-license
dependencies; changing product behavior beyond asset replacement; suppressing a
license finding without an evidence-linked decision.

**Acceptance:**

- Given a tracked asset, when its bytes change, then checksum drift blocks CI
  until a new provenance review is recorded.
- Given a dependency or container, when scanned, then exact version, purpose,
  SPDX expression, compatibility, notice, source-offer, patent, and
  redistribution obligations have a decision.
- Given an unknown or incompatible item, then it is removed, substituted, or
  remains release-blocking.

**Rollback:** remove or restore the affected dependency/asset and its matching
notice; never retain an orphaned grant or erase historical evidence.

**Observability:** machine-readable obligation report, SBOM digest, and safe
asset IDs.

**Verification:**

```text
pnpm verify
gitleaks git --config=.gitleaks.toml --redact --no-banner
node tools/run-supply-chain.mjs
node tools/verify-sbom.mjs
node --test tests/compliance.test.mjs tests/repository-policy.test.mjs
git diff --check
```

**Gate:** asset/IP reviewer, software-license reviewer, security reviewer.

## S05 — Clear brand and domain

**Result:** Name, Block-Z, claim, and domain each have a dated professional
search/ownership decision, evidence reference, intended classes/territories,
fallback, and renewal owner. No search is described as a legal guarantee.

**Risk:** R3

**Allowed paths:**

```text
compliance/brand-clearance.yaml
compliance/rights-register.yaml
docs/legal/BRAND-CLEARANCE.md
TRADEMARKS.md
README.md
PLAN.md
public/**
app/components/BlockZ.tsx
tests/brand-policy.test.mjs
```

**Forbidden:** automated domain purchase; trademark filing by an agent;
committing receipts or owner PII; using `®` before registration; treating a
DENIC 404, exact-name search, DPMAregister, or TMview result as clearance.

**Acceptance:**

- Given each identifier, when the register is checked, then search method,
  classes, territories, date, result, reviewer, evidence, and fallback exist.
- Given domain acquisition, then a safe evidence reference proves control and
  records renewal responsibility without publishing personal or payment data.
- Given rejection, then a bounded rename plan identifies all affected paths and
  redirects.

**Rollback:** use the approved fallback name/mark; domain and trademark filings
require a human-managed legal rollback or abandonment decision.

**Observability:** renewal/recheck dates and non-sensitive status; no registrant
PII.

**Verification:**

```text
node --test tests/brand-policy.test.mjs tests/rendered-html.test.mjs
npm test
```

**Gate:** trademark counsel and accountable owner.

## S06 — Approve OSM and synthetic pilot sources

**Result:** The pilot has an approved synthetic fixture and, for later ingest,
an exact OSM extract path, ODbL database-layer decision, attribution, offer,
lineage, withdrawal, and own-tile architecture. OpenStation/StaDa may be
approved here only if the same review covers their field-level combination.

**Risk:** R3

**Allowed paths:**

```text
compliance/sources.yaml
compliance/assets.yaml
compliance/rights-register.yaml
docs/legal/sources/OSM.md
docs/legal/sources/SYNTHETIC-PILOT.md
docs/legal/sources/OPENSTATION.md
docs/legal/sources/STADA.md
docs/SERVICES.md
app/lib/pilot-data.ts
app/components/OperationsConsole.tsx
tests/source-policy.test.mjs
tests/rendered-html.test.mjs
```

**Forbidden:** downloading or committing a real extract in this slice; provider
calls in CI; public OSM/ORM tiles or Nominatim; mixing proprietary facts into an
OSM feature layer without the approved classification; copying provider
responses into fixtures.

**Acceptance:**

- Given the UI demo, then it remains visibly synthetic and makes no real
  timetable, block, speed, quality-class, or OSM-origin claim.
- Given an OSM release proposal, then exact provider, date, checksum, coverage,
  transformation, ODbL classification, attribution, database offer, and
  withdrawal are accepted before import.
- Given independent station facts, then field-level lineage and
  Derivative/Collective treatment are explicit.

**Rollback:** remain on or return to the approved synthetic fixture; no active
world mutates and no live provider fallback occurs.

**Observability:** source IDs, snapshot IDs, checksums, license state, and
lineage only.

**Verification:**

```text
node --test tests/source-policy.test.mjs tests/rendered-html.test.mjs
npm test
```

**Gate:** data-rights counsel, data steward, railway reviewer, independent
repository reviewer.

## S07 — Decide remaining RG-4 sources, services, and privacy

**Result:** Every source and service consumed through `RG-4` is approved with
conditions, substituted, or excluded. Privacy and service decisions cover the
current demo plus the intended RG-4 data classes. RG-5-only sources remain named
future gates.

**Risk:** R3

**Allowed paths:**

```text
compliance/sources.yaml
compliance/services.yaml
compliance/rights-register.yaml
docs/legal/SOURCE-DECISIONS.md
docs/legal/PRIVACY-BASELINE.md
docs/legal/sources/**
docs/SERVICES.md
tests/source-policy.test.mjs
tests/service-policy.test.mjs
tests/privacy-policy.test.mjs
```

**Forbidden:** live integration; secrets; raw provider samples; contract text;
PII; treating `DEFERRED`, `CANDIDATE`, or `CONTRACT_REQUIRED` as approval;
silently removing `REALISTIC` from Full Release scope.

**Acceptance:**

- Given each source required through RG-4, then its state is
  `APPROVED`, `APPROVED_WITH_CONDITIONS`, `EXCLUDED`, or it has an approved
  substitute; no unknown permission remains on an active path.
- Given connected or planned services, then hosting, purpose, data classes,
  personal-data state, failure, removal, owner, rights, retention, and first
  consumer are recorded.
- Given realistic disruption feeds, then they remain `CONTRACT_REQUIRED` for
  `MS-039` unless an independently reviewed provider set is genuinely approved.

**Rollback:** disable the affected future integration or release path; keep the
last approved synthetic/self-hosted alternative and immutable evidence.

**Observability:** source/service coverage matrix, expiry alerts, and safe
decision IDs.

**Verification:**

```text
node --test tests/source-policy.test.mjs tests/service-policy.test.mjs tests/privacy-policy.test.mjs
npm test
```

**Gate:** data-rights, privacy, contract, security, and service-owner approval.

## S08 — Integrated-main audit and exit evidence

**Result:** Current integrated `main`, including MS-002 toolchains and all
MS-001 slices, passes a fresh rights, dependency, asset, source, brand, service,
privacy, and license audit. `MS-001` moves to `completed` only with current
human and independent evidence.

**Risk:** R3

**Allowed paths:**

```text
planning/evidence/MS-001.yaml
planning/milestones.yaml
docs/ROADMAP.md
README.md
compliance/rights-register.yaml
```

Fixes outside this allowlist require returning to the owning slice; S08 must not
hide implementation changes inside an evidence PR.

**Forbidden:** completing on a stale branch; self-approval; accepting expired
sources; recording confidential evidence; marking future `MS-039` rights as
approved; relaxing tests to manufacture a pass.

**Acceptance:**

- Given the integrated candidate, when every recorded command runs from a fresh
  checkout, then all ecosystems, assets, sources, services, and notices match
  the approved decisions.
- Given every RG-4 source, then no open or expired right remains.
- Given every required human gate, then safe evidence references, roles, dates,
  and digests exist.
- Given independent review, then no implementation agent approves or merges its
  own change.

**Rollback:** milestone remains `verifying`; no approved license grant,
contributor statement, domain action, or provider permission is claimed to be
retroactively undone.

**Observability:** final evidence manifest, scan artifact digests, expiry
coverage, open limitations, and next unlocked milestones.

**Verification:**

```text
pnpm install --frozen-lockfile
uv sync --all-packages --locked
node tools/verify-gradle-wrapper.mjs
.\gradlew.bat --no-daemon --console=plain check
node tools/preflight.mjs
pnpm verify
gitleaks git --config=.gitleaks.toml --redact --no-banner
node tools/run-supply-chain.mjs
node tools/verify-sbom.mjs
git diff --check
git diff --exit-code
git status --short
```

Linux evidence uses `./gradlew --no-daemon --console=plain check`; all other
logical phases and artifact checks are identical.

**Gate:** project owner, rights holder, qualified legal reviewers, independent
technical reviewers, and human merge approval.

## Definition of done

MS-001 is complete only when:

- `FEAT-0003` is accepted;
- all eight slices are merged in dependency order;
- the root license state matches the recorded owner decision;
- RG-4 sources and services have no open or expired authorization;
- assets and dependencies have complete obligations and notices;
- name, Block-Z, claim, and domain have dated human decisions;
- privacy boundaries through RG-4 are approved;
- Full Release-only sources remain explicit future gates where unresolved;
- `planning/evidence/MS-001.yaml` points to the integrated commit and current
  independent/human evidence.
