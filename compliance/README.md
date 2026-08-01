# Zugfolge compliance control plane

This directory is the public, machine-readable control plane for rights,
licensing, brand, source, service, and privacy decisions.

It is deliberately **not** legal advice or proof of ownership. In
`LICENSED_REVIEW_PENDING`:

- the explicitly mapped code, contract, and documentation license grants are
  published;
- provenance-pending files remain outside those grants;
- a demo build containing a provenance-pending file is evaluation-only and is
  blocked from public deployment or release distribution;
- external contributions remain closed;
- no source may be imported into a production or player-visible data release;
- no provider may be placed in the simulation, login, or ledger hot path;
- no source, asset, brand, service, or privacy record becomes approved merely
  because the license matrix is active;
- confidential contracts, personal data, API keys, and unredacted legal advice
  must not be committed.

The older `PREPARATION` state means no project license publication has been
recorded. `ACTIVE` is reserved for a later state whose required human gates
have actually passed.

## Files

- [`rights-register.yaml`](rights-register.yaml) is the current public
  inventory and decision state.
- [`schemas/rights-register.schema.json`](schemas/rights-register.schema.json)
  defines the fields and allowed states.
- [`../docs/legal/SOURCE-RISK-MEMO.md`](../docs/legal/SOURCE-RISK-MEMO.md)
  explains the source-specific risks in human-readable form.
- [`../planning/MS-001-KICKOFF.md`](../planning/MS-001-KICKOFF.md) divides the
  legal milestone into bounded, independently reviewable slices.

## Status semantics

Only `APPROVED` and `APPROVED_WITH_CONDITIONS` can authorize a data source, and
only within the recorded permissions and release scope. Neither state is
created by the separate repository-license decision.

`SUBSTITUTED` resolves a source only when it points to a separately approved
replacement; it does not make the original source eligible. `EXCLUDED` is a
deliberate technical prohibition. `CONTRACT_REQUIRED` and
`HUMAN_REVIEW_REQUIRED` are blocking states. A milestone deferral is never an
approval. `EXPIRED` must fail release checks until the source is renewed,
substituted, or removed.

Private evidence is referenced by a non-secret identifier and digest. It is
stored in an access-controlled legal system outside this repository.

CI evaluates `reviewAfter`, source validity, and contract expiry against the
actual run date. A stale operative record must move to `EXPIRED`, `EXCLUDED`, or
`REJECTED`; changing only `statusAsOf` cannot preserve an approval. The
`releaseCoverage` matrix must cover every milestone, required source, and
service through `RG-4`.
