# FEAT-0003: Rights, license, brand, and source clearance

**Status:** Proposed

**Version:** 0.1

**Date:** 2026-07-30

**Milestone:** MS-001

## Outcome

Create an auditable human decision system that prevents Zugfolge from granting
rights it does not hold or using code, brands, assets, services, or railway data
outside documented permissions.

This proposal does not itself grant a license, approve a provider, clear a
trademark, reserve a domain, or provide legal advice. Its requirements become
normative only after the listed human gate accepts the specification.

## Preconditions

- `MS-000` is complete.
- The repository remains `UNLICENSED`.
- External contributions are closed.
- `CONST-006`, `CONST-012`, and `ADR-0003` remain authoritative.
- Confidential evidence is stored outside the public repository.

## In scope

- ownership and AI-assisted-work provenance;
- code, contract, documentation, data, fixture, and asset license boundaries;
- contribution model;
- name, claim, Block-Z, and domain clearance evidence;
- source and provider permission records through `RG-4`;
- explicit exclusions and future gates for `RG-5` and Full Release sources;
- third-party dependency and asset obligations;
- current external demo-hosting disclosure and production privacy baseline;
- expiry, withdrawal, substitution, attribution, and release blocking.

## Out of scope

- legal advice by an AI agent;
- actual domain registration or trademark filing;
- committing confidential contracts, personal data, credentials, or private
  legal opinions;
- ingesting provider data;
- implementing provider adapters, production services, payment, accounts, or
  telemetry;
- declaring a source approved based only on public availability;
- changing the root license before the rights-holder and legal gates pass.

## Proposed requirements

### RIGHTS-001 — Accountable rights holder

The repository MUST record the role of the natural or legal person authorized
to license code, documentation, assets, and trademarks. A Git author identity,
repository ownership, or AI-service output assignment MUST NOT be treated as
sufficient evidence by itself.

The rights chain for prior human, employee, contractor, and AI-assisted work
MUST be reviewed before the first licensed commit is published.

### RIGHTS-002 — AI and third-party provenance

Every material source asset and fixture MUST record a checksum, origin,
AI-assistance state, evidence reference, permitted uses, and accountable human
review. Generated output MUST be checked for recognizable third-party code,
assets, confidential inputs, and incompatible licenses.

### RIGHTS-003 — License boundaries

Code, public contracts/SDKs, documentation, original fixtures, OSM-derived
databases, brands, premium assets, third-party feeds, and player data MUST have
separate, explicit license or rights decisions.

Until all human gates pass:

- package metadata MUST remain `UNLICENSED`;
- no root `LICENSE` MUST be added;
- no repository text may imply an Open Source grant;
- the first commit carrying a license grant MUST be recorded;
- a later license change MUST acknowledge that grants already received under a
  valid earlier license are not silently revoked.

### RIGHTS-004 — Contributions

External contributions MUST remain closed until the owner chooses and counsel
approves one contribution model:

- inbound equals outbound plus DCO for a single-license Open Source strategy; or
- an appropriate individual and corporate CLA before any contribution needed
  for proprietary or dual licensing.

The contribution policy MUST require contributors to disclose AI assistance and
affirm that they have the rights required for their submission.

### RIGHTS-005 — Brand and domain

`Zugfolge`, the Block-Z, the claim, and the domain MUST be reviewed separately.
Each record MUST identify the search scope, relevant classes, date, result,
reviewer role, evidence, fallback/rename path, and renewal or recheck date.

Automated availability, DPMA, EUIPO/TMview, WIPO, and web searches MAY provide
evidence but MUST NOT be described as legal clearance. The project MUST NOT use
`®` before a corresponding registration exists.

### RIGHTS-006 — Source register

Before implementation, every data source MUST have a versioned entry containing
at least:

- source ID, official name, provider, intended fields, geography, and use;
- consuming milestones and release gate;
- exact endpoint or delivery method, authentication, limits, and cadence;
- license/contract title, version, date, URL, and evidence reference;
- commercial retrieval, storage, transformation, combination, display,
  redistribution, archival, replay, and fixture permissions;
- exact attribution and placement;
- ODbL Original/Derivative/Collective Database and Produced Work decision where
  relevant;
- privacy class, retention, freshness, failure, fallback, withdrawal, deletion,
  substitution, and rollback behavior;
- review status, accountable role, review date, recheck date, and expiry.

Unknown permission MUST remain `UNKNOWN`; it MUST NOT inherit permission from a
different source or a generic public-access assumption.

### RIGHTS-007 — Use gate and expiry

Only `APPROVED` and `APPROVED_WITH_CONDITIONS` MAY authorize use, and only for
the recorded scope. `CANDIDATE`, `HUMAN_REVIEW_REQUIRED`,
`CONTRACT_REQUIRED`, and `EXPIRED` MUST block dependent production releases.

`EXCLUDED` and `REJECTED` MUST prevent adapter configuration and data use.
Deferral to another milestone MUST NOT count as approval.

An expired, withdrawn, or materially changed permission MUST identify every
affected raw snapshot, derived artifact, world release, attribution, and
fixture. Existing active worlds MUST follow an approved safe withdrawal or
replacement procedure; they MUST NOT silently fetch a different provider.

### RIGHTS-008 — OSM separation

OSM extracts, OSM railway tags, OpenRailwayMap documentation, public OSM tiles,
public OpenRailwayMap services, and Nominatim MUST be separate records.

Zugfolge MUST use approved, versioned OSM extracts and its own tile pipeline.
Public OSM/ORM tiles and public Nominatim MUST NOT be a production backend.
Proprietary provider facts MUST NOT be merged into an OSM-derived feature layer
until qualified review records whether the result is a Derivative Database or a
Collective Database and defines the data-offer obligations.

### RIGHTS-009 — Restricted railway systems

Unless a future approved contract explicitly changes these decisions:

- Trassenfinder MUST NOT supply engine, capacity, tariff, calibration, stored
  results, or test fixtures;
- pathOS and TPN MUST NOT receive fictional orders or act as a validation
  backend;
- uncontracted real disruption websites or APIs MUST NOT be scraped or imported;
- the `REALISTIC` mode MUST remain unavailable until `MS-039` approves a
  provider set covering storage, mapping, display, replay, audit, retention, and
  deletion.

The Pilot Beta MAY use `SIMULATED` and `MANUAL`; Full Release remains blocked if
the product constitution still requires an unavailable `REALISTIC` mode.

### RIGHTS-010 — Services and privacy

Every external or self-hosted service MUST record purpose, owner, hosting model,
data classes, personal-data state, failure impact, removal path, rights
references, and first consuming milestone.

A machine-readable coverage matrix MUST map every milestone through `RG-4` to
the source and service capabilities it needs. Missing coverage, a stale review,
or an unregistered first consumer MUST block the affected release.

The current connected demo hosting MUST be labelled development-only and MUST
NOT receive player accounts, provider data, payments, or production state.
Before those data classes exist, a human privacy review MUST record purpose,
legal basis, data subjects, fields, processors, regions, retention, deletion,
access, incident handling, and any required impact assessment.

## Acceptance scenarios

### AC-001 — Preparation grants no rights

**Given** `repositoryStatus` is `PREPARATION`

**When** the compliance register is validated

**Then** the root package remains `UNLICENSED`

**And** the first licensed commit is empty

**And** no source or asset is marked approved

**And** external contributions remain closed.

### AC-002 — Machine-readable source completeness

**Given** a source is present in the register

**When** schema validation runs

**Then** every field required by `RIGHTS-006` exists

**And** source, brand, asset, service, and component IDs are unique

**And** no source can declare a synchronous simulation, login, or ledger hot
path.

### AC-003 — Unknown rights block use

**Given** a source permission is unknown or requires human review or contract

**When** a dependent release is evaluated

**Then** the source cannot authorize an import or production release

**And** the output identifies the accountable role and next action.

### AC-004 — Excluded public services stay absent

**Given** public OSM tiles, public OpenRailwayMap services, public Nominatim,
Trassenfinder, and pathOS/TPN are excluded

**When** configuration and dependency checks run

**Then** no production adapter or endpoint for them is accepted

**And** the recorded self-hosted or own-engine fallback remains visible.

### AC-005 — Realistic disruption gate

**Given** no disruption provider contract grants all required rights

**When** a world or release requests `REALISTIC` data

**Then** activation is blocked

**And** no silent substitution to `SIMULATED` occurs

**And** the required `MS-039` human gate is reported.

### AC-006 — Asset drift is visible

**Given** a registered asset changes

**When** compliance tests hash tracked assets

**Then** an unreviewed checksum change fails

**And** the asset cannot inherit prior provenance evidence.

### AC-007 — Expired permission blocks release

**Given** an approved source reaches `reviewAfter` or a contractual expiry

**When** release validation runs

**Then** its effective state becomes release-blocking

**And** the withdrawal, affected-artifact, and substitution procedure is
required before release.

### AC-008 — Private evidence remains private

**Given** a contract, legal opinion, domain receipt, or identity document
contains confidential or personal data

**When** evidence is recorded

**Then** only a non-secret reference, digest, accountable role, and decision
date enter the repository.

### AC-009 — License change is atomic

**Given** the owner and legal gates approve a license mosaic

**When** the first license slice is prepared

**Then** root license files, notices, package metadata, contribution terms, UI
source link, tests, and the first licensed commit record change together

**And** a failed consistency check leaves the repository explicitly
`UNLICENSED`.

### AC-010 — MS-001 closes on integrated main

**Given** MS-002 or another parallel branch changed dependencies or assets

**When** final MS-001 evidence is produced

**Then** dependency, asset, source, and license checks run against the integrated
current `main` candidate

**And** completion is rejected while an RG-4 source is open or expired

**And** RG-5 deferrals remain named release blockers rather than approvals.

## Observability and evidence

CI MUST report only IDs, states, expiry dates, missing fields, and safe evidence
references. It MUST NOT print contract text, personal data, access credentials,
private legal advice, or hidden reasoning.

The final `MS-001` evidence record MUST identify exact commands, artifact
digests, integrated candidate commit, independent reviewers, human approval
roles, open limitations, and the first licensed commit if one exists.

## Human gate

This specification requires approval by:

- the project owner and identified rights holder;
- qualified software-license and data-rights counsel;
- qualified trademark counsel;
- the privacy owner or data-protection counsel;
- an independent repository reviewer.

Until those approvals are recorded, the feature remains `Proposed`, MS-001
remains incomplete, and no implementation issue may turn a candidate into an
approval.
