# Zugfolge license decision

**Decision date:** 2026-07-30

**Decision authority:** project owner
**Repository state:** license matrix active; wider MS-001 review remains open

## Decision

The project owner directed the following public license matrix:

| Scope | License |
|---|---|
| Original program code, tests, build and runtime configuration | `AGPL-3.0-or-later` |
| Public OpenAPI, AsyncAPI, JSON Schema contracts, and generated public SDKs | `Apache-2.0` |
| Original specifications, ADRs, planning, and documentation | `CC-BY-4.0` |
| Future, separately approved OSM-derived database releases | `ODbL-1.0` |
| Explicitly mapped provenance-pending fixtures and media | no grant (`LicenseRef-Zugfolge-Provenance-Pending`) |
| Names, source identifiers, endorsement, and official-world presentation | separate trademark policy |

The exact file mapping is in [`REUSE.toml`](../../REUSE.toml). Standard license
texts are in [`LICENSES/`](../../LICENSES/).

The current `BlockZ.tsx` implementation, favicon, social image, and synthetic
pilot fixture remain excluded from the standard grants until their file-level
provenance review is complete. Once a Block-Z implementation is cleared and
assigned a program-code license, that copyright permission will still grant no
trademark right or permission to imply that a fork is an official Zugfolge
service.

The current local demo build still contains those four files to keep the
development baseline testable. It is evaluation-only and MUST NOT be publicly
deployed or distributed until every pending file is approved, replaced, or
technically excluded.

No OSM-derived database is present or approved by this decision. ODbL becomes
operative only for a release whose own manifest, attribution, provenance,
classification, and database-offer gate are complete. The data pipeline itself
remains program code under AGPL.

## Contribution decision

The selected future model is an individual/entity Contributor License
Agreement. External contributions remain closed until:

- qualified counsel approves the operative CLA text;
- signature authority, privacy, retention, and revocation handling are defined;
- a required repository check verifies the correct individual or entity record;
- contributor AI assistance and third-party rights are disclosed.

No agent-generated CLA text is operative.

## Public decision evidence

- Reference:
  `https://github.com/larynxberlin-rgb/Zugfolge/issues/14#issuecomment-5134262815`
- SHA-256 of the exact GitHub comment body:
  `3BB30988DFA5772B135F7A5D15569F417E80372C9BE278F1A1DBA8C2DE6F7173`
- Reviewer role: `PROJECT_OWNER`

This public record contains no identity document or private contract.

## Limits and open gates

This decision, as narrowed by the file-level provenance safeguards recorded in
the rights register, activates the standard repository licenses. It does not claim
that qualified counsel has reviewed them, that every historic authorship or
AI-output question is resolved, or that brands, data sources, provider feeds,
privacy, domain control, and launch assets are cleared.

Those open items continue to block MS-001 completion and any affected release.
The license grant for a version already distributed under a valid public
license is not silently revoked by a later repository change.

## First-publication attestation

The first licensed repository state is commit
`f8c3cb1c58b3034da8f70e0664c1d398849b9e39` (`Publish Zugfolge license
mosaic`). It was attested at `2026-08-01T05:30:24Z` using
`TWO_COMMIT_PARENT_ATTESTATION_V1`.

This attestation is stored in the immediate child commit so that the referenced
Git object can be known without a circular self-hash. Automated policy tests
verify the parent relationship, the grant commit's pending state, and the
attestation commit's restricted path set whenever the required Git history is
available.
