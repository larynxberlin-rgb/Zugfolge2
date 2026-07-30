# Railway data and service rights risk memo

**Status:** preparation evidence; no source approval

**Date:** 2026-07-30

**Scope:** sources needed through Pilot Beta (`RG-4`) plus named Full Release
blockers

**Not legal advice**

The authoritative state is
[`compliance/rights-register.yaml`](../../compliance/rights-register.yaml).
This memo explains why the initial records are conservative.

## Executive decision boundary

Zugfolge may be realistic without making a live external system authoritative.
The safe architecture imports reviewed snapshots into immutable releases,
retains field-level lineage, and keeps every provider outside simulation, login,
and ledger hot paths.

No candidate source is approved by this memo. The preparation baseline is:

- use only the synthetic fixture in the current non-authoritative demo;
- plan a versioned OSM PBF import and own tile pipeline, subject to ODbL review;
- investigate OpenStation and StaDa as station-data candidates;
- block RINF and tariff publication use until written rights decisions exist;
- exclude public OSM/ORM tiles, public Nominatim, Trassenfinder, pathOS, and TPN
  from product backends;
- keep `REALISTIC` disruption mode unavailable until `MS-039` secures a
  qualifying contract;
- inventory vehicle, demand, font, audio, illustration, energy, terminal,
  industry, and price sources before their consuming milestones.

The register's `releaseCoverage` records every `RG-0` through `RG-4`
milestone, its source capabilities, and its service dependencies. Payment,
optional external notifications, and observability are explicit service
records; a named category is not permission to use a provider.

## Source findings

| Source | Preparation state | Technical rule |
|---|---|---|
| OSM PBF and railway tags | human review required | Import a pinned extract, separate OSM-derived and independently licensed layers, publish attribution and any required database offer, and never mutate an active world in place. |
| OpenRailwayMap | documentation only; public service excluded | Treat railway tags as OSM data. Use ORM tagging pages only as reviewed interpretation guidance. Build an own map style and tiles. |
| OpenStation | human review required | The provider states CC0 and recommends Mobilithek for permanent production. Pin the exact dataset, delivery route, terms, fields, and checksum before import. |
| StaDa | human review required | The provider states CC BY 4.0 and marketplace conditions. Resolve the apparent call-frequency wording and record exact attribution and OSM-combination treatment. |
| RINF | human review required | Regulatory publication and application access do not by themselves answer all storage, transformation, combination, and redistribution questions. Obtain a written reuse decision. |
| Trassenfinder | excluded | Its disclaimer limits use to individual route finding, excludes general analysis/reconstruction and non-immediate result storage, and says it does not consider path conflicts. Do not use it for planner, capacity, tariff, calibration, fixtures, or stored results. |
| pathOS/TPN | excluded | Do not assume that systems for eligible access parties are public validation or fictional-order APIs. A future contract and eligibility decision would require a new gate. |
| TPS/SPS/APS/INB and facility prices | human review required | Register each tariff period. Review facts/formulas, automatic extraction, document archiving, examples, attribution, and redistribution separately before implementing an `EconomyRelease`. |
| Real works and incident feeds | contract required | No qualifying open feed has been verified for persistent commercial import, map display, derivation, replay, and retention. Pilot worlds use `SIMULATED` or `MANUAL`; Full Release remains blocked while `REALISTIC` is constitutional scope. |
| Public OSM/ORM tiles and Nominatim | excluded | Never use them as production backends. Self-host versioned tiles and, only if justified, a geocoder. Operational-point search should use the pinned infrastructure index. |

## Primary evidence

- OSM data is offered under ODbL with attribution and share-alike conditions:
  [OSM copyright and license](https://www.openstreetmap.org/copyright).
- OSMF explains attribution for interactive maps and specifically permits
  suitable attribution locations in games and simulations:
  [OSMF attribution guidelines](https://osmfoundation.org/wiki/Licence/Attribution_Guidelines).
- The OSMF tile and Nominatim services are not general product backends:
  [tile policy](https://operations.osmfoundation.org/policies/tiles/) and
  [Nominatim policy](https://operations.osmfoundation.org/policies/nominatim/).
- OpenRailwayMap asks commercial users to run their own infrastructure, forbids
  bulk requests, and provides no availability guarantee:
  [OpenRailwayMap API terms](https://wiki.openstreetmap.org/wiki/OpenRailwayMap/API).
- DB InfraGO describes OpenStation as CC0 and points permanent production users
  to Mobilithek:
  [OpenStation product page](https://developers.deutschebahn.com/db-api-marketplace/apis/product/open-station).
- DB InfraGO describes StaDa as CC BY 4.0 with API and marketplace conditions:
  [StaDa product page](https://developers.deutschebahn.com/db-api-marketplace/apis/product/stada).
- ERA's RINF terms place responsibility for submitted information with Member
  States, registration entities, and infrastructure managers and discuss
  intellectual-property responsibilities:
  [RINF Terms of Use v1.0](https://www.era.europa.eu/system/files/2022-11/rinf_terms_of_use_en.pdf).
- Trassenfinder's official disclaimer excludes general analysis, reconstruction,
  and non-immediate result storage:
  [Trassenfinder OpenAPI](https://openapi.trassenfinder.de/).
- DB InfraGO documents pathOS access within its infrastructure usage
  conditions:
  [INB 2027 Annex 4.2](https://www.dbinfrago.com/resource/blob/13699956/a039c34210a6c9679f1a50a7e753ee12/INB-2027-Anlage-4-2-data.pdf).

## ODbL architecture question

Operational attributes attached directly to OSM features may form part of an
ODbL Derivative Database. Merely storing tables separately does not prove that a
combined release is a Collective Database. Before `MS-020` fixes the release
model, a qualified data-license review must classify:

1. raw OSM snapshots;
2. normalized OSM railway facts;
3. independently sourced operational facts;
4. join keys and combined query products;
5. infrastructure graph and conflict resources;
6. map tiles and other Produced Works;
7. the reproducible database or change-set offer made to public users.

Non-redistributable provider data must not leak into an ODbL offer, client tile,
test fixture, log, replay export, or public contract.

## Withdrawal and expiry

Every approved source eventually needs a `reviewedAt`, `reviewAfter`, contract
expiry where applicable, and an owner. On expiry, withdrawal, or material terms
change:

1. stop creating new snapshots;
2. identify raw and derived artifacts through lineage;
3. block new worlds and releases that depend on the source;
4. preserve or delete evidence only as permitted;
5. activate the approved last-safe, substitution, or shutdown path;
6. update attribution and any database offer;
7. never silently replace `REALISTIC` with `SIMULATED`.

## Human decisions still required

- OSM Derivative-versus-Collective Database and offer design;
- exact extract provider and cadence;
- OpenStation delivery route and StaDa marketplace interpretation;
- RINF commercial reuse;
- every tariff-period fact and document use;
- realistic works/incident provider contract;
- sources for vehicles, demand, economic calibration, fonts, audio, and art;
- privacy and retention for every authenticated API and external host.
