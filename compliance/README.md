# Zugfolge compliance control plane

This directory is the public, machine-readable preparation area for rights,
licensing, brand, source, service, and privacy decisions.

It is deliberately **not** a legal approval. As long as
`rights-register.yaml` says `PREPARATION`:

- the repository remains `UNLICENSED`;
- external contributions remain closed;
- no source may be imported into a production or player-visible data release;
- no provider may be placed in the simulation, login, or ledger hot path;
- a candidate license, public term, API page, or availability check is evidence
  for review, not permission granted by the Zugfolge owner;
- confidential contracts, personal data, API keys, and unredacted legal advice
  must not be committed.

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

Only `APPROVED` and `APPROVED_WITH_CONDITIONS` can eventually authorize use,
and only within the recorded permissions and release scope. Neither state is
present during preparation.

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
