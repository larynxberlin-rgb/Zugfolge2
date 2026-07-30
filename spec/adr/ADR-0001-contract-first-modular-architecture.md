# ADR-0001: Contract-first modular game architecture

**Status:** Accepted  
**Date:** 2026-07-30  
**Deciders:** Product Owner, Architecture Steward

## Context

Zugfolge combines a persistent real-time simulation, capacity allocation,
economy, external railway data, a browser client, and a separate Odoo back
office. The codebase will be produced predominantly by AI agents, making small
interfaces and explicit ownership more valuable than deployment-level
distribution. The runtime must support deterministic replay and a single
authoritative answer for train movement and resource occupation.

## Decision

Zugfolge will use a monorepo and a contract-first modular architecture:

- The browser client is React with strict TypeScript and consumes generated or
  schema-validated v1 contracts.
- The authoritative game runtime is a Kotlin service organized as a modular
  monolith with explicit domain boundaries for worlds, infrastructure,
  timetables, simulation, occupations, and economy.
- Each active world has one logical authoritative command/simulation writer.
  Horizontal scale is achieved by assigning different worlds to different
  runtime instances, not by allowing concurrent writers for one world.
- Durable world snapshots plus an ordered event stream support recovery and
  deterministic replay. The storage and messaging products require a separate
  ADR before implementation.
- Data-import workers create immutable, validated infrastructure/data snapshots;
  they never mutate a running world's snapshot in place.
- REST commands and snapshots follow OpenAPI v1. Live-map changes follow
  AsyncAPI v1. Shared domain payloads are defined once as JSON Schema.
- Odoo is reached through a dedicated adapter outside the simulation hot path.

Modules MUST communicate through declared application interfaces. A module MUST
NOT read another module's private tables or implementation types.

## Options considered

### Contract-first modular monolith

| Dimension | Assessment |
|---|---|
| Delivery complexity | Low to medium |
| Deterministic consistency | High |
| Independent scaling | By world; module extraction later |
| AI-agent coordination | Explicit and bounded |

**Pros:** one authoritative transaction boundary, simple local testing, fewer
distributed failure modes, contracts are reusable when extracting services.

**Cons:** a single deployment can become large; hotspots require profiling and
careful module discipline.

### Microservices from the first release

| Dimension | Assessment |
|---|---|
| Delivery complexity | High |
| Deterministic consistency | Harder |
| Independent scaling | High |
| AI-agent coordination | Many distributed contracts |

Rejected because distributed transactions, ordering, version skew, and
observability would add risk before workload boundaries are measured.

### Implement the game inside Odoo

| Dimension | Assessment |
|---|---|
| Back-office productivity | High |
| Real-time simulation fit | Low |
| Isolation from billing/admin | Low |
| Replay control | Low |

Rejected because the simulation and shared live world need an independent,
deterministic runtime.

## Consequences

- Public schemas are reviewed before code and form the integration boundary.
- The runtime must enforce module boundaries in build and architecture tests.
- World assignment needs lease/fencing semantics before multi-instance runtime.
- A module is extracted only when profiling demonstrates independent scaling,
  failure-isolation, or release-cadence needs. Extraction requires a new ADR.
- Persistence, event-store, deployment, and identity technology remain separate
  decisions; this ADR does not silently select them.
