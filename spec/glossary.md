# Zugfolge glossary

**Status:** Accepted  
**Version:** 1.0

| Canonical term | Meaning |
|---|---|
| Zugfolge | Product name and repository-wide project name. In railway terminology, also the ordered succession and temporal spacing of trains. |
| Spielwelt / world | A persistent, isolated simulation with one rules revision, infrastructure snapshot, clock, economy, players, and event stream. |
| Eisenbahnverkehrsunternehmen / EVU | A player-controlled railway undertaking. Contracts use `company` for the legal/game entity and `operatorCompanyId` on a train run. |
| SPFV | Eigenwirtschaftlicher Schienenpersonenfernverkehr. Contract value: `SPFV`. |
| SGV | Eigenwirtschaftlicher Schienengüterverkehr. Contract value: `SGV`. |
| SPNV | Bestellter Schienenpersonennahverkehr awarded through a tender. Contract value: `SPNV`. |
| Infrastruktur-Snapshot | Immutable, identified version of the railway graph and its operational attributes used by a world. |
| Betriebsstelle | Operational point such as a station, junction, siding, or boundary represented in the infrastructure snapshot. |
| Infrastrukturressource | Smallest resource for which v1 grants exclusive occupation, for example a block or platform track. |
| Block | Signalling or capacity section represented as an infrastructure resource. V1 does not claim that every imported resource is a real signalling block unless provenance says so. |
| Trasse / path | Timed use of an ordered sequence of infrastructure resources by a train run. It is not newly built infrastructure. |
| Trassenanfrage / path request | Request to allocate a proposed path. It can be allocated, rejected, or revised according to world rules. |
| Zuglauf / train run | One planned and simulated movement of a train, identified by `trainRunId`, including path, calls, times, status, and live state. |
| Belegung / occupation | Time-bounded reservation or actual use of one infrastructure resource by one train run. End times are exclusive. |
| Fahrplan | Collection of timed train runs and their operational calls in a world. |
| Livemap | Shared client view derived from authoritative train-run and occupation state. It is not an independent simulation. |
| Störung / operational disruption | Unplanned operational restriction or loss of availability with explicit validity and severity. |
| Baustelle / construction site | Planned, time-bounded infrastructure restriction. Players do not create infrastructure through it. |
| Störungsrichtlinie / disruption policy | World rule selecting `REALISTIC`, `SIMULATED`, or `MANUAL` independently for planned works and operational incidents. |
| Realistisch | Disruption mode importing only approved external observations and declared fallback behavior. |
| Simuliert | Disruption mode generating deterministic server-side events from the configured seed and distributions. |
| Manuell | Disruption mode in which no automatic event is created and authorized operators enter events explicitly. |
| Ledger entry | Immutable balanced in-game accounting transaction composed of at least two postings. |
| Posting | Debit or credit line in a ledger entry, denominated in integer minor units. |
| Replay | Rebuilding authoritative state from a snapshot and an ordered event sequence. |
| World sequence | Strictly increasing event-stream position used by clients to detect duplicates and gaps. |
| OSM | OpenStreetMap. |
| OpenRailwayMap | Railway-focused rendering/tag interpretation based on OSM data. To avoid ambiguity with object-relational mapping, spell the name out in specifications. |
| Datenprovenienz / provenance | Evidence describing where data came from, under which permission, when, in which version, and through which transformations. |
| Odoo | Separate back-office system. It is not the game runtime or simulation authority. |
| Entitlement | Server-validated permission to use a paid or administrative convenience feature. It never changes competitive rules. |
| Walking Skeleton | Smallest end-to-end slice proving contracts, company creation, one path request, one simulated train movement, live-map delivery, and ledger integration. |
