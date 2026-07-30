# Zugfolge product constitution

**Status:** Accepted  
**Version:** 1.0  
**Date:** 2026-07-30

## Product promise

Zugfolge is a persistent, data-based browser simulation in which players build
and operate railway undertakings on existing railway infrastructure. It combines
company management with operationally credible timetables, path capacity,
vehicle use, disruptions, and live train movements.

## Constitutional rules

### CONST-001 — Existing infrastructure

Players MUST use versioned representations of existing railway infrastructure.
They MUST NOT build tracks, stations, signals, or other infrastructure. Planning
and operations MAY select, reserve, and use existing infrastructure resources.

### CONST-002 — Supported business models

Game worlds MUST be able to enable:

- eigenwirtschaftlicher Schienenpersonenfernverkehr (SPFV),
- eigenwirtschaftlicher Schienengüterverkehr (SGV), and
- bestellter Schienenpersonennahverkehr (SPNV) through tenders.

The economic and contractual rules MAY differ by business model, but they MUST
share the same operational capacity model.

### CONST-003 — Capacity is physical

Infrastructure capacity MUST be derived from the active, versioned
infrastructure snapshot and its operational attributes. Exclusive occupations of
the same resource MUST NOT overlap. A path request MAY be rejected or changed
when the requested capacity is unavailable.

The first contract version models exclusivity at infrastructure-resource level.
More detailed signalling headways MAY be introduced only through a versioned
domain specification and contract change.

### CONST-004 — Deterministic simulation

All trains in an active world MUST be simulated. Given the same world snapshot,
ordered input events, rules, random seed, and software version, replay MUST
produce the same authoritative state. Wall-clock time and unordered delivery
MUST NOT be hidden simulation inputs.

### CONST-005 — Shared live world

Every authorized player in a world MUST be able to see all currently simulated
train movements on the live map. Commercially sensitive details MAY be hidden,
but identity, service, operational state, delay, and map position MUST be derived
from the same authoritative simulation used for capacity.

### CONST-006 — Data provenance

Railway and price data MUST be traceable to an approved source record containing
at least source identity, license or permission, retrieval time, schema version,
validity, and checksum. Derived data MUST retain its lineage. Missing facts MUST
remain unknown or use an explicitly documented simulation default; they MUST NOT
be presented as observed facts.

OpenStreetMap and OpenRailwayMap are intended base sources. Any additional
public or commercial source requires an approved registry entry before use.

### CONST-007 — World-specific disruptions

Every world MUST select one source mode for planned works and one source mode
for operational incidents. The two modes are configured independently, and
each MUST be exactly one of:

- `REALISTIC`: approved external data is imported;
- `SIMULATED`: deterministic server rules generate events with configurable
  frequency, duration, and severity;
- `MANUAL`: no automatic event of the corresponding kind is created;
  authorized operators may create it with explicit start and end.

Unavailable realistic data MUST follow the configured, visible fallback policy.
It MUST NOT silently turn into simulated data.

### CONST-008 — Fair monetization

The core game MUST be playable without payment. Paid entitlements MAY provide
cosmetics, saved views, notifications, reporting, bulk user-interface actions,
or convenience automation whose manual equivalent is available to free players.

Payment MUST NOT alter path priority, capacity access, infrastructure rules,
prices, tender scoring, random outcomes, vehicle performance, simulation speed,
or server scheduling priority. Paid automation MUST operate under the same rules,
limits, information, and timing as manual actions.

### CONST-009 — Economy integrity

Authoritative in-game financial movements MUST use immutable, balanced ledger
entries in integer minor currency units. Reversals MUST be new entries; posted
entries MUST NOT be edited or deleted. Real-money billing MUST remain outside the
competitive in-game ledger.

### CONST-010 — Odoo is back office

Odoo MAY manage player administration, world administration, entitlements,
billing metadata, helpdesk, and back-office workflows. It MUST NOT own train
movement, path allocation, occupations, the competitive economy, or the
authoritative game clock. Loss of Odoo connectivity MUST NOT stop an already
running world.

### CONST-011 — Dark, operational interface

The primary interface SHOULD use a modern dark visual system, including the map.
Safety and state MUST NOT be communicated by color alone. Dense operational data
MUST remain readable, keyboard accessible, and usable without premium features.

### CONST-012 — Specification-driven AI development

AI agents MAY implement the complete software system, but they MUST work from
versioned specifications and contracts. Agents MUST stop rather than invent a
product rule, provider capability, legal permission, or safety-critical default.
