# Zugfolge specifications

This directory defines the intended behavior of Zugfolge. It is written for
product owners, domain specialists, engineers, and AI agents.

## Document map

- `00-product-constitution.md` contains immutable product principles and
  cross-cutting invariants.
- `glossary.md` defines canonical railway and game terminology.
- `adr/` records accepted architecture decisions and their trade-offs.
- `features/` contains executable-style feature specifications.
- `../packages/contracts/` contains the machine-readable v1 interfaces.

Current feature documents:

- `FEAT-0001` defines the accepted contract-first Walking Skeleton behavior.
- `FEAT-0002` proposes the reproducible TypeScript/Kotlin/Python engineering
  baseline for `MS-002`. It remains non-normative until its required human
  security review is recorded.
- `FEAT-0003` proposes rights, license, brand, and source clearance rules. It
  grants no rights until its human gate accepts it.

`ADR-0005` records the matching proposed build and supply-chain decision. It is
not accepted until the same security gate is complete.

Delivery order and completion evidence live under `../planning/`. A milestone
may schedule specification work, but it is not itself a product rule and cannot
override an accepted specification, ADR, contract, or the precedence in
`AGENTS.md`.

## Change rules

- A document is normative when its status is `Accepted`.
- Accepted behavior is changed by editing the relevant specification and
  recording the rationale. Architecture decisions are superseded by a new ADR,
  not rewritten to conceal earlier decisions.
- Every normative statement uses the terms MUST, MUST NOT, SHOULD, SHOULD NOT,
  or MAY with their ordinary RFC 2119 meaning.
- Examples clarify a rule but do not override normative text.
- Unresolved product decisions are marked `OPEN` and block dependent
  implementation. There are no open decisions in the Walking Skeleton.

## Identifiers

- Product rules: `CONST-nnn`
- Architecture decisions: `ADR-nnnn`
- Feature specifications: `FEAT-nnnn`
- Acceptance scenarios: `AC-nnn`
- Public contract version: `v1`

If documents conflict, follow the precedence in the repository `AGENTS.md`.
