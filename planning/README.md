# Zugfolge delivery planning

This directory turns the product vision into work that can be commissioned,
implemented, and accepted one milestone at a time.

## Source of truth

- [`milestones.yaml`](milestones.yaml) is the machine-readable delivery plan.
- [`MILESTONE_PROMPT.md`](MILESTONE_PROMPT.md) is the required kickoff prompt.
- [`EVIDENCE_TEMPLATE.yaml`](EVIDENCE_TEMPLATE.yaml) defines the completion record.
- [`../docs/ROADMAP.md`](../docs/ROADMAP.md) explains the plan for humans.
- [`MS-002-KICKOFF.md`](MS-002-KICKOFF.md) records the active preparation
  package for the next technical milestone, including its human security gate.
- [`MS-001-KICKOFF.md`](MS-001-KICKOFF.md) is the prepared rights, license,
  brand, source, service, and privacy work contract.

The delivery plan schedules work. It does not define product behavior and never
overrides `AGENTS.md`, the product constitution, accepted specifications, ADRs,
or public contracts.

## Unit of delivery

A milestone is an independently commissioned outcome and acceptance gate. It is
not permission for one large pull request. Before implementation, its lead agent
must:

1. resolve every listed dependency;
2. create or update the required specifications, ADRs, and contracts;
3. split the milestone into bounded feature issues;
4. obtain the listed human decisions;
5. implement and verify the issues in dependency order;
6. record exit evidence and receive an independent review.

The project owner can start a milestone by saying, for example:

```text
Starte Zugfolge-Meilenstein MS-010.
```

The agent must then use the kickoff prompt and stop at the preparation gate
before inventing any unresolved product or architecture decision.

## Status values

- `completed`: all exit evidence exists in the repository.
- `ready`: all repository-controlled dependencies are complete; work may start.
- `in-progress`: approved feature slices are currently being delivered.
- `verifying`: implementation is frozen while independent exit checks run.
- `planned`: the milestone is sequenced but a dependency is still open.
- `blocked`: work cannot continue without an explicit external or owner action.

Changing a status to `completed` requires evidence, not an estimate.

The final evidence record is copied from `EVIDENCE_TEMPLATE.yaml`, named after
the milestone under `planning/evidence/`, and committed with the status change.
It contains references and digests, never credentials, raw provider data, or
hidden reasoning.

## Effort bands

Effort is expressed as bounded change sets rather than calendar promises:

- `S`: approximately 1–3 feature pull requests;
- `M`: approximately 4–8 feature pull requests;
- `L`: approximately 9–15 feature pull requests.

If discovery shows that a milestone exceeds `L`, its specification review must
split it before implementation.

## Release gates

Release gates group milestones into externally meaningful product states.
Completing a release gate does not permit skipping a milestone dependency.
`RG-7` is the only gate that authorizes the label **Full Release 1.0**.
