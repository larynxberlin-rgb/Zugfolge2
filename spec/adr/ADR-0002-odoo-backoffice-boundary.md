# ADR-0002: Keep Odoo outside the game authority

**Status:** Accepted  
**Date:** 2026-07-30  
**Deciders:** Product Owner, Architecture Steward

## Context

Odoo Community can accelerate player administration, game-world administration,
entitlements, billing metadata, helpdesk, and operational workflows. It is not
designed to be the authoritative real-time simulator or railway capacity
allocator. Coupling simulation ticks to Odoo availability would make running
worlds dependent on a back-office outage.

## Decision

Odoo is a separate back-office system with a versioned integration adapter.

Odoo MAY own:

- helpdesk cases and back-office correspondence;
- product catalog, invoices, and payment-provider references;
- entitlement administration;
- player moderation and world lifecycle requests;
- administrative reporting projections.

The game runtime owns:

- player-visible company and world state;
- game clock, train runs, paths, occupations, and live-map events;
- tenders and all competitive economy decisions;
- in-game ledger entries and authoritative balances;
- enforcement of entitlements at the action boundary.

Odoo MUST NOT write game-domain tables or publish authoritative train/economy
events. Back-office commands use versioned APIs, idempotency keys, explicit
authorization, and audit records. The game publishes projections to Odoo
asynchronously. Temporary Odoo unavailability MUST queue or reject administrative
work predictably and MUST NOT pause an active world.

Real-money billing identifiers MUST NOT appear as in-game ledger accounts.
Entitlement changes take effect only after server-side validation and MUST
respect ADR-0004.

## Options considered

### Bounded back-office integration

Provides administrative leverage while preserving simulation autonomy. Requires
an adapter, reconciliation, and eventual-consistency handling.

### Odoo as authoritative application database

Rejected because it would couple domain transactions and live simulation to
back-office models, upgrades, and availability.

### No Odoo

Technically viable, but rejected for the initial plan because it would duplicate
administration, billing, and helpdesk capabilities. This can be revisited if
integration cost exceeds its benefit.

## Consequences

- The adapter requires contract, authorization, retry, dead-letter, and
  reconciliation tests.
- Back-office screens may be eventually consistent and must display data age.
- A compromised Odoo account cannot directly create occupations, alter path
  priority, credit the game ledger, or change simulation state.
- Odoo modules and upgrades can be deployed independently of the game runtime.
