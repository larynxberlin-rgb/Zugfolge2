# ADR-0003: Version and preserve railway-data provenance

**Status:** Accepted  
**Date:** 2026-07-30  
**Deciders:** Product Owner, Data Steward, Architecture Steward

## Context

Zugfolge enriches an OSM/OpenRailwayMap-based graph with operational attributes
such as permitted speed, signals, and train-protection information. Public price,
path, construction, and disruption data may be added when legally and
technically available. Sources differ in freshness, coverage, precision, terms,
and identifiers. A mutable "latest" dataset would make simulation results
irreproducible and obscure whether a value was observed, derived, or defaulted.

## Decision

Every imported dataset is represented by an immutable source snapshot registered
before use. Its provenance record MUST include:

- opaque source ID and source class;
- license/permission and required attribution;
- retrieval and source-validity timestamps;
- original format and declared schema/profile version;
- cryptographic checksum and byte size;
- geographic/operational coverage;
- parser and transformation version;
- parent snapshot IDs for derived artifacts;
- validation result, known limitations, and approval status.

Raw inputs are immutable. Normalization creates a new artifact; it never changes
the raw snapshot. A world pins one infrastructure snapshot and explicit
auxiliary-data revisions. Refreshing data creates a proposed world revision and
requires validation before activation.

Each normalized fact carries a quality state:

- `OBSERVED` for a supported source value;
- `DERIVED` for a reproducible transformation;
- `DEFAULTED` for an explicitly documented simulation default;
- `UNKNOWN` when evidence is absent.

Defaults MUST NOT overwrite or masquerade as observations. Conflicting sources
are resolved by a documented rule that records all candidates and the selected
value. No provider-specific adapter may be implemented until its permission,
contract, identifiers, rate/failure behavior, and attribution are registered.

## Options considered

### Immutable snapshots with lineage

Offers replay, auditability, rollback, and license traceability at the cost of
storage and pipeline complexity.

### Query live providers during simulation

Rejected because provider latency, outages, corrections, and unordered changes
would make world state non-deterministic.

### Copy current values without provenance

Rejected because errors, permissions, and transformation decisions could not be
audited or corrected safely.

## Consequences

- Tests use pinned, redistributable fixtures; CI does not call live providers.
- Source removal or license change can identify every affected derived artifact
  and world.
- Realistic disruption mode consumes approved snapshot/import revisions and
  follows the world's explicit stale-data behavior.
- Storage retention and attribution presentation need operational policies
  before production ingestion.
