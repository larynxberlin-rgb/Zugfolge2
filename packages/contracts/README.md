# Zugfolge public contracts

**Contract version:** v1  
**Status:** Foundation for FEAT-0001

## License

The original OpenAPI, AsyncAPI, JSON Schema, contract examples, and generated
public SDKs in this package are licensed under
[`Apache-2.0`](../../LICENSES/Apache-2.0.txt). This permissive contract boundary
does not relicense server implementations, imported provider material, or
provenance-pending fixtures.

## Canonical artifacts

- `openapi/openapi.yaml` defines authenticated HTTP commands and recovery
  snapshots.
- `asyncapi/livemap.yaml` defines the ordered WebSocket live-map stream.
- `json-schema/` defines shared `WorldRules`, `DisruptionPolicy`, `TrainRun`,
  `Occupation`, and `LedgerEntry` payloads.

OpenAPI and AsyncAPI reference the JSON Schema files directly. Do not copy these
models into either API document. Implementations may generate language types,
but these source files remain authoritative.

## Semantics not expressible in JSON Schema

Applications and contract tests MUST additionally enforce:

- timestamp and sequence ordering within train paths and planned calls;
- `plannedEndAt` after `plannedStartAt`;
- occupation `endAt` after `startAt`;
- no overlapping `RESERVED` or `ACTIVE` exclusive occupations for the same
  world, infrastructure snapshot, and resource;
- simulated severity weights summing to `1`, and maximum duration not being
  lower than minimum duration;
- planned works and operational incidents selecting their source modes
  independently;
- a realistic mode having an approved provider set and a visible,
  non-simulated fallback;
- debit posting totals equalling credit posting totals;
- world IDs, entity revisions, and infrastructure snapshot IDs agreeing across
  envelopes and nested entities;
- `entityVersion` equalling the nested entity's `revision`;
- rejection details appearing only on rejected train runs;
- runtime state appearing only when operationally meaningful.

## Delivery and recovery

- Commands are at-least-once at the transport boundary and idempotent in the
  application.
- Live events are at-least-once and strictly sequenced per world.
- A consumer deduplicates by `eventId`. On a gap it installs
  `GET /worlds/{worldId}/live-map/snapshot` and resumes with events whose sequence
  is greater than the returned `worldSequence`.
- Timestamps are UTC. Display time zones come from `WorldRules`.
- Integer `amountMinor` values prevent floating-point money errors.

## Provider neutrality

No contract in v1 asserts the availability of a live railway, price,
construction, or disruption provider. `sourceId` values are opaque references to
approved provenance records. Adding a provider requires ADR-0003 compliance and
provider-specific adapter contracts.

## Compatibility policy

Adding an optional property is backward compatible. Removing, renaming,
retyping, narrowing an enum, changing requiredness, or changing command/event
semantics is breaking and requires a new major contract version or an explicit
compatibility migration. Consumers MUST ignore unknown event types only when a
future envelope version explicitly permits it; v1 treats them as a resync/error.
