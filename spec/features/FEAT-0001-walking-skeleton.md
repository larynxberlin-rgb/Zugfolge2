# FEAT-0001: End-to-end Walking Skeleton

**Status:** Accepted  
**Version:** 1.0  
**Date:** 2026-07-30

## Outcome

Prove one authoritative path from world rules through company creation, train-run
planning, capacity allocation, deterministic movement, live-map delivery, and
balanced accounting. This is an architectural slice, not a complete game loop.

## Preconditions

- One test world pins an approved, immutable infrastructure fixture and tariff
  fixture. Their content is not fetched from a live provider during the test.
- The world clock uses real time with speed multiplier `1`.
- The world uses `MANUAL` for both planned works and operational incidents and
  has no active manual event.
- The fixture contains at least two connected exclusive infrastructure
  resources and two operational points.
- One authenticated player is a member of the world.

## In scope

- read world rules;
- create one company;
- create and submit one train run of any enabled business model;
- allocate a conflict-free ordered resource path;
- simulate the train across that path;
- publish ordered train-run and occupation changes;
- recover the live map from a snapshot after a stream gap;
- post one configured path charge to the in-game ledger.

## Out of scope

- live-provider integrations;
- signalling headways more detailed than exclusive resource occupation;
- rolling-stock procurement and maintenance;
- SPNV tender evaluation;
- passenger or freight demand;
- real-money billing and paid entitlements;
- automatic construction sites or disruptions.

## Command and event flow

1. The client reads `WorldRules`.
2. The player creates a `Company` with an idempotent command.
3. The player creates a `TrainRun` draft against the world's pinned
   infrastructure snapshot.
4. Submission changes the run to `REQUESTED`.
5. The allocator atomically creates non-overlapping `Occupation` reservations
   and changes the run to `ALLOCATED`, or changes it to `REJECTED`.
6. At planned time the simulator advances the train, updating run and occupation
   state in one authoritative order.
7. The live stream emits changes with a strictly increasing world sequence.
8. The configured path charge creates one immutable, balanced `LedgerEntry`.

## Business rules

- An idempotency key identifies one logical write command. Repeating it with the
  same payload returns the original result; a different payload is rejected.
- Occupation intervals are half-open: `[startAt, endAt)`.
- `RESERVED` and `ACTIVE` occupations are exclusive. They MUST NOT overlap for
  the same world, infrastructure snapshot, and resource.
- The simulator MUST acquire the next resource and release the previous resource
  atomically or in an order that never exposes an unsafe overlap.
- Live events are at-least-once. Consumers deduplicate by `eventId`, apply them
  in `sequence` order, and request a REST snapshot on any sequence gap.
- The snapshot's `worldSequence` is the first expected live-stream predecessor:
  clients apply only events with a greater sequence.
- Allocation and ledger writes are idempotent under retries.
- The path charge uses the pinned tariff fixture; this feature makes no claim
  about a live path-pricing provider.

## Acceptance scenarios

### AC-001 — Read pinned world rules

**Given** the Walking Skeleton world exists  
**When** the player reads its rules  
**Then** the response identifies the world, rules revision, infrastructure
snapshot, enabled business models, real-time speed `1`, currency `EUR`, and one
valid disruption policy.

### AC-002 — Create a company idempotently

**Given** the player belongs to the world  
**When** the same create-company request is sent twice with the same idempotency
key and payload  
**Then** both responses identify the same company and only one company exists.

**When** the key is reused with a different payload  
**Then** the command is rejected as an idempotency conflict.

### AC-003 — Create a train-run draft

**Given** an active company and a path whose resources belong to the pinned
infrastructure snapshot  
**When** the player creates a train run with ordered, increasing path times  
**Then** one `DRAFT` train run is returned with revision `1`.

### AC-004 — Allocate a conflict-free path

**Given** no exclusive occupation overlaps the requested intervals  
**When** the draft is submitted  
**Then** it first becomes `REQUESTED` and eventually `ALLOCATED`  
**And** exactly one `RESERVED` occupation exists for every path resource  
**And** all results refer to the same world, train run, and infrastructure
snapshot.

### AC-005 — Reject a conflicting path safely

**Given** another train has a `RESERVED` or `ACTIVE` occupation overlapping one
requested resource interval  
**When** the draft is submitted  
**Then** the run becomes `REJECTED` with reason `CAPACITY_CONFLICT`  
**And** no occupation is created for the rejected run  
**And** existing occupations remain unchanged.

### AC-006 — Start and display the train

**Given** an allocated run reaches its planned start time  
**When** the authoritative simulation tick is processed  
**Then** the run becomes `RUNNING`  
**And** its current occupation becomes `ACTIVE`  
**And** the live stream publishes corresponding events in increasing sequence
order  
**And** every authorized world player can derive the same visible position.

### AC-007 — Move without double occupation

**Given** a running train reaches the boundary of its current resource  
**When** the next tick is committed  
**Then** the previous occupation is `RELEASED` and the next is `ACTIVE`  
**And** no observable committed state contains overlapping active trains on
either exclusive resource.

### AC-008 — Recover after a live-stream gap

**Given** a client last applied sequence `n` and next receives `n+2`  
**When** it requests the live-map snapshot  
**Then** the snapshot contains all visible train runs, current `RESERVED` and
`ACTIVE` occupations, and its authoritative `worldSequence`  
**And** replaying later events produces the same map as a continuously connected
client.

### AC-009 — Post a balanced path charge

**Given** the path is allocated and its configured charge has not been posted  
**When** allocation accounting is processed or retried  
**Then** exactly one `POSTED` ledger entry references that allocation  
**And** it contains at least one debit and one credit posting  
**And** debit minor units equal credit minor units.

### AC-010 — Replay deterministically

**Given** the initial snapshot, ordered commands/events, fixtures, seed, and
software version are fixed  
**When** the complete scenario is replayed twice  
**Then** both runs produce the same train-run states, occupations, ledger
entries, world sequence, and canonical state hash.

### AC-011 — Manual disruption mode is inert until commanded

**Given** the world uses `MANUAL` for planned works and operational incidents  
**When** time advances without an authorized manual event command  
**Then** no construction site or operational disruption is created.

## Observability

The slice MUST expose correlation IDs and structured events for command outcome,
allocation decision, occupation conflict, simulation tick, live-stream sequence
gap, replay divergence, and ledger reconciliation. Logs MUST reference opaque
IDs and MUST NOT contain credentials or private billing data.
