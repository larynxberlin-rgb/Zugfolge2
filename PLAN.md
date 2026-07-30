# Zugfolge – Gesamtplan für die realistische Eisenbahn-Unternehmenssimulation

**Status:** autoritative Produkt- und Lieferplanung  
**Stand:** 30. Juli 2026  
**Claim:** „Plane präzise. Fahre profitabel.“  
**Descriptor:** „Die realistische Eisenbahn-Unternehmenssimulation“

Dieser Plan beschreibt das Zielprodukt. Akzeptierte Produktregeln und konkrete
Implementierungsverträge werden zusätzlich in `spec/` und
`packages/contracts/` versioniert. Bei Widersprüchen gilt die
Autoritätsreihenfolge aus `AGENTS.md`.

## 1. Produkt, Marke und Spielerlebnis

### 1.1 Produktdefinition

Zugfolge ist ein persistentes, serverautoritäres Browsergame nach dem
Grundprinzip von AirlineSim, aber mit deutlich höherem betrieblichem,
infrastrukturellem und wirtschaftlichem Realismus.

- Öffentliche Welten laufen dauerhaft und ohne regelmäßige Wipes in
  1:1-Echtzeit.
- Sämtliche sichtbaren Züge gehören Spielern; es gibt keine
  NPC-Eisenbahnunternehmen.
- Reale Fahrplandaten dienen nur zur Kalibrierung und Qualitätssicherung, nicht
  als Verkehr der Spielwelt.
- Spieler bauen keine Gleise, Bahnhöfe oder Infrastruktur. Sie nutzen das
  vorhandene, versionierte Netz.
- Spieler führen ihr EVU strategisch und operativ, fahren Züge aber nicht selbst
  und stellen keine Signale.
- Erste geschlossene Pilotregion ist Leipzig–Halle–Erfurt mit Infrastruktur- und
  Wirtschaftsstand 2026.
- Tutorial- und private Welten dürfen beschleunigt laufen; öffentliche
  Wettbewerbswelten bleiben bei 1:1.

### 1.2 Marke und Block-Z

Das verbindliche Markenzeichen ist das **Block-Z**:

- Drei voneinander getrennte Gleis-/Blocksegmente bilden ein geometrisches `Z`.
- Ein cyanfarbener Punkt beziehungsweise Impuls symbolisiert einen Zug, der die
  Blöcke nacheinander belegt.
- Das Zeichen muss bei 16 px, einfarbig und ohne Animation erkennbar bleiben.
- Varianten: horizontale Wortmarke, quadratisches App-Icon, Favicon,
  monochrome Fassung und helle Notfallversion.
- Animationen sind dezent und werden bei `prefers-reduced-motion` deaktiviert.
- Ausgeschlossen sind Lokomotivsilhouette, Flügelrad, Wappenästhetik und eine
  DB-nahe Rot-Weiß-Gestaltung.

Verbindliches Designsystem:

| Verwendung | Farbe |
|---|---|
| Haupthintergrund | `#0B1016` |
| Oberflächen | `#121A23` |
| Primärtext | `#E7F0F5` |
| Aktiver Fahrweg/Marke | `#39C6E5` |
| Plus/Konto/Kosmetik | `#8B7CFF` |
| Warnung | `#FFB84D` |
| Konflikt/Sperrung | `#FF647C` |
| Regelbetrieb | `#45D39A` |

- Wortmarke: Inter Tight SemiBold.
- UI: Inter.
- Zeiten, Zugnummern und Betriebswerte: JetBrains Mono.
- Farbe ist niemals alleiniger Statusträger; Text, Symbol oder Muster ergänzen
  den Status.
- Vor weiterer öffentlicher Produktvermarktung oder einem Launch werden
  Domainkontrolle und DPMA-/EUIPO-Ähnlichkeitsrecherchen dokumentiert; die
  heutige Nutzung im öffentlichen Entwicklungsrepository bleibt ausdrücklich
  vorläufig.
- Die Domainprüfung ist keine Reservierung und wird vor jeder öffentlichen
  Aussage erneut verifiziert.

### 1.3 Zentrale Benutzeroberflächen

- **Live-Lage:** dunkle Deutschlandkarte mit allen fahrenden Zügen,
  Verspätungen, Sperrungen und Belegungen.
- **Fahrplan und Trassen:** Laufwegsuche, Bildfahrplan, Sperrzeitentreppe,
  Konflikterklärung und Alternativangebote.
- **Betriebszentrale:** laufende Zugfahrten, Anschlüsse, Umläufe, Störungen und
  Dispositionsregeln.
- **Märkte:** SPFV-Nachfrage, SGV-Aufträge und SPNV-Ausschreibungen.
- **Fahrzeuge und Personal:** Flotte, Formationen, Kompatibilität, Wartung,
  Abstellung und Qualifikationspools.
- **Unternehmen und Finanzen:** Liquidität, Ledger, Kostenstellen, Kredite,
  Verträge und Ergebnisrechnung.
- **Postfach:** Trassenangebote, Fristen, Ausschreibungen, Störungen und
  administrative Nachrichten.

Desktop erhält die vollständige Leitstellenansicht. Die PWA für Smartphone und
Tablet unterstützt Livemap, Meldungen, Freigaben und begrenzte Disposition;
komplexe Fahrplanarbeit bleibt desktop-first.

## 2. Spielsystem, Wirtschaft und Realismus

### 2.1 Gemeinsamer Spielkreislauf

```text
Markt erkennen
  → Angebot planen
  → Fahrzeuge und Personal sichern
  → Trasse beantragen
  → Betrieb durchführen
  → Ergebnis auswerten
  → Angebot verbessern
```

Alle drei Geschäftsfelder sind vollständig spielbar:

- **SPFV:** eigenwirtschaftliche Linien, Haltepolitik, Tarife, Komfort,
  Nachfrage, Vertrieb und vollständiges Erlösrisiko.
- **SGV:** Verladerverträge, Spot- und Langfristaufträge, Zugbildung, Terminals,
  Wagenumläufe, Leerfahrten und Lieferqualität.
- **SPNV:** spielweltgenerierte Ausschreibungen mit Leistungsbeschreibung,
  Qualitätsanforderungen, Mobilisierungsphase, Angebotswertung,
  Verkehrsvertrag, Bonus und Pönale.

Gemeinsame Kosten und Restriktionen:

- Trassen-, Stations-, Abstell- und Anlagenentgelte;
- Fahrzeugkauf, Leasing und Finanzierung;
- Energie, Personal und Verwaltung;
- Wartung, Fristen und Werkstattaufenthalte;
- Leer- und Zuführungsfahrten;
- Verspätungs-, Ausfall- und Vertragsfolgekosten.

Geld wird ausschließlich als Integer-Cent beziehungsweise feste Dezimalwerte in
einem unveränderlichen, ausgeglichenen Ledger geführt. Alle Balancewerte liegen
in einem versionierten `EconomyRelease` und werden nicht im Programmcode fest
verdrahtet.

### 2.2 Nachfrage und Wettbewerb

- Personenverkehr verwendet ein zonenbasiertes Nachfragemodell aus Bevölkerung,
  Arbeitsplätzen, POIs, Reiseanlässen, Saison und Tageszeit.
- Die Verkehrsmittel- und Zugwahl bewertet Fahrpreis, Reisezeit, Umstiege, Takt,
  Zuverlässigkeit und Komfort.
- Güterverkehr entsteht aus Industrie-, Terminal-, Hafen- und
  Warenstrommodellen sowie aus generierten Verladerverträgen.
- SPNV-Aufgabenträger sind simulierte Marktakteure, aber keine Zugbetreiber.
- Reale öffentliche Daten kalibrieren Größenordnungen; reale Personen oder
  vertrauliche Unternehmensdaten werden nicht nachgebildet.
- Kredite, Restrukturierung und Insolvenz gehören zur Wirtschaft. Ein Scheitern
  beendet das EVU kontrolliert, nicht den Benutzeraccount.

### 2.3 Fahrzeuge und Personal

- Fahrzeuge sind individuelle Assets mit Baureihe, Antrieb, Länge, Masse,
  Leistung, Höchstgeschwindigkeit, Zugsicherung, Zulassung, Wartungsfristen und
  Eigentumsstatus.
- Formationen werden aus Fahrzeugen gebildet und gegen Strecke, Bahnsteig,
  Elektrifizierung und Zugsicherung geprüft.
- Personal wird als regionaler Qualifikations- und Dienstkapazitätspool
  modelliert; einzelne Mitarbeiterbiografien sind nicht Teil der ersten
  Version.
- Dienst-, Wartungs-, Abstell- und Fahrzeugumlaufkonflikte verhindern die
  Freigabe eines nicht durchführbaren Fahrplans.
- Sicherheits- und Offline-Disposition bleibt für alle Spieler kostenlos
  verfügbar.

### 2.4 Infrastruktur und Konfliktprüfung

Die Infrastruktur wird als betrieblicher Graph modelliert.
Konfliktressourcen umfassen:

- reale und konservativ erzeugte Blockabschnitte;
- Fahrstraßen, Weichen und kreuzende Bewegungen;
- eingleisige Gegenfahrten;
- Bahnsteig- und Bahnhofskopfbelegungen;
- Abstell- und Servicegleise;
- Durchrutschwege, Räumzeiten und Mindestzugfolgen;
- Zuglänge, Fahrdynamik und infrastrukturelle Kompatibilität.

Die harte Invariante lautet:

> Keine zwei Züge dürfen zur gleichen Zeit inkompatible Belegungen derselben
> Konfliktressource besitzen.

Mehrere Züge dürfen auf derselben Strecke fahren, wenn unterschiedliche
freigegebene Blöcke belegt werden. Ein pauschales Verbot für einen gesamten
Streckenabschnitt wäre nicht realistisch.

Trassenvergabe:

1. Ein `PathRequest` enthält Formation, Verkehrstage, Halte, Wunschzeiten und
   zulässige Abweichungen.
2. Der Planner erzeugt Laufweg- und Zeitkandidaten mit relativen
   Belegungsprofilen.
3. Reguläre Anträge eines Planungsfensters werden gemeinsam in einem
   deterministischen `PlanningRun` behandelt.
4. Die Reihenfolge innerhalb des Fensters und der Bezahlstatus beeinflussen das
   Ergebnis nicht.
5. Exakte Gleichstände werden über einen veröffentlichten, je Planungsperiode
   rotierenden Seed aufgelöst.
6. Ad-hoc-Anträge verwenden ausschließlich verbleibende Kapazität.
7. Annahme, Alternativtrasse und Ablehnung enthalten eine maschinenlesbare und
   verständliche Begründung.

### 2.5 Simulation und Livemap

- Die Simulation ist ereignisgesteuert; Positionen werden zwischen
  Betriebspunkten analytisch berechnet.
- Nur die nächsten 48–72 Stunden werden als vollständige
  `TrainRun`-Instanzen materialisiert.
- Wiederkehrender Verkehr wird als `ServicePattern` plus relativem
  `OccupationProfile` gespeichert.
- Regionale Single-Writer-Prozesse besitzen die jeweiligen
  Konfliktressourcen.
- Eine Regionsgrenze wird erst übergeben, wenn die Folgeregion die Belegung
  bestätigt.
- Verspätungen, Fahrzeugstörungen und Infrastrukturrestriktionen propagieren
  regelbasiert.
- Der Browser erhält einen Initialsnapshot und anschließend Sequenz-Deltas;
  Positionen werden entlang der Gleisgeometrie interpoliert.
- Sichtbar sind EVU, Zugart, Zugnummer, Position, Geschwindigkeit, Verspätung,
  nächster Betriebspunkt und Betriebsstatus.
- Vertrags- und Ladungsdetails bleiben geschützt.

### 2.6 Baustellen und Störungen

Jede Welt konfiguriert Baustellen und ungeplante Störungen unabhängig:

```text
DisruptionPolicy
  plannedWorksMode: REALISTIC | SIMULATED | MANUAL
  operationalIncidentMode: REALISTIC | SIMULATED | MANUAL
  providerSetId
  simulationProfile
  rulesetVersion
```

#### Realistisch

- Autorisierte externe Bau- und Störungsfeeds werden in 1:1-Zeit importiert und
  auf Konfliktressourcen gemappt.
- Quelle, Abrufzeit, Gültigkeit und Confidence bleiben sichtbar.
- Bei Ausfall eines Providers gilt der letzte sichere Stand; es erfolgt kein
  stiller Wechsel auf Simulation.
- Falschzuordnungen können ausschließlich durch auditierte Admin-Korrekturen
  überschrieben werden.

#### Simuliert

- Ein deterministischer Generator erzeugt Ereignisse anhand von Häufigkeit,
  Schwere, Dauer, Vorlauf, Region, Infrastrukturart und Belastung.
- Alle Parameter sind je Welt einstellbar.
- Gleicher Seed, gleiche Weltversion und gleiche Ereignisse ergeben dasselbe
  Ergebnis.
- Standard für Pilot- und erste Großwelt: simuliert und auf 2026 kalibriert.

#### Manuell

- Es entstehen keinerlei automatische Baustellen oder Störungen.
- Autorisierte Spielleiter legen Beginn, Ende, Ursache, betroffene Ressourcen
  und Wirkung händisch an.
- Beginn und Ende sind Pflichtfelder; jede Änderung wird protokolliert.

Modi dürfen während einer laufenden Fahrplanperiode nicht unangekündigt
gewechselt werden. Änderungen treten erst an einem veröffentlichten
Fahrplanstichtag in Kraft.

### 2.7 Datenquellen und Qualitätsklassen

- Ein genehmigter, versionierter OSM-PBF-Extract ist die vorgesehene Basis für
  Geometrie und OSM-Railway-Tags. OpenRailwayMap ist dabei
  Interpretationsdokumentation, kein separater Datenprovider.
- OSM-abgeleitete und unabhängig lizenzierte Fakten bleiben getrennte
  Datenebenen, bis eine qualifizierte ODbL-Prüfung die
  Derivative-/Collective-Database- und Bereitstellungspflichten freigibt.
- OpenStation und StaDa sind Stationsdaten-Kandidaten. Exakte Version,
  Bereitstellungsweg, Marketplace-Bedingungen, Attribution und Feldmapping
  müssen vor einem Import genehmigt sein.
- RINF bleibt bis zu einer schriftlichen Wiederverwendungsentscheidung
  blockiert. pathOS und TPN sind ohne neue Berechtigung und ausdrücklichen
  Vertrag als Spiel- oder Validierungsbackend ausgeschlossen.
- Öffentliche OSM-/OpenRailwayMap-Tiles und öffentliches Nominatim werden nicht
  produktiv genutzt. Das Spiel erzeugt und hostet eigene Dark-Vector-Tiles.
- Der Trassenfinder speist weder Planner, Kapazität, Tarif, Kalibrierung noch
  Fixtures; allgemeine Analyse und nicht zeitnahe Ergebnisspeicherung sind laut
  Disclaimer ausgeschlossen. Zugfolge besitzt eine eigene Kapazitäts- und
  Tarifengine.
- Entgeltregeln aus TPS-/SPS-/APS-/INB- und Anlagen-/Stationspreisquellen
  werden erst nach einer periodenbezogenen Rechteentscheidung als eigene,
  versionierte Regeln implementiert und mit zulässigen offiziellen Beispielen
  geprüft.
- Reale Baustellen- und Störungsfeeds benötigen einen Vertrag, der kommerziellen
  Abruf, Speicherung, Ableitung, Kartendarstellung, Replay, Audit, Aufbewahrung
  und Löschung abdeckt. Bis `MS-039` bleibt `REALISTIC` nicht freigegeben.
- Jedes importierte Attribut trägt Quelle, Lizenz, Gültigkeit, Checksumme und
  Confidence.

Der maschinenlesbare Vorbereitungsstatus steht in
[`compliance/rights-register.yaml`](compliance/rights-register.yaml); das
rechtlich-technische Risikomemo steht in
[`docs/legal/SOURCE-RISK-MEMO.md`](docs/legal/SOURCE-RISK-MEMO.md). Eine Nennung
im Plan ist niemals eine Datenfreigabe.

Qualitätsklassen:

- **A – validiert:** Signale, Fahrstraßen und Blöcke manuell beziehungsweise
  fachlich geprüft; vollständige Simulation.
- **B – konservativ:** Datenlücken werden durch sichtbare virtuelle Blöcke und
  sichere Annahmen geschlossen; vollständig spielbar.
- **C – unzureichend:** Darstellung auf der Karte, aber keine
  Trassenbestellung.

Jede Welt pinnt einen vollständigen Release-Satz aus Infrastruktur, Tarifen,
Nachfrage, Fahrzeugkatalog und Regeln. Updates erfolgen ausschließlich zu
angekündigten Fahrplanstichtagen.

## 3. Plattformarchitektur und Schnittstellen

### 3.1 Festgelegter Stack

- Frontend: React, TypeScript, MapLibre GL JS und PWA.
- Backend: Kotlin auf JVM 21 als modularer Monolith.
- Eigenständig skalierbare Prozesse: Simulation Runtime, Livemap Gateway und
  Datenpipeline.
- GIS-/Importpipeline: Python, GDAL, osmium und Polars.
- Persistenz: PostgreSQL/PostGIS; Game-, Infrastruktur- und Odoo-Datenbanken
  bleiben getrennt.
- Eventing: PostgreSQL-Outbox und NATS JetStream.
- Redis/Valkey: ausschließlich Cache, Presence und Rate Limits.
- S3-kompatibler Object Store: Rohdaten, Releases, Snapshots und kalte Events.
- ClickHouse: erst bei nachgewiesenem Analysebedarf im Großbetrieb.
- Deployment: signierte OCI-Container; Kubernetes erst bei messbarem
  Skalierungsbedarf.
- Observability: OpenTelemetry, Prometheus, Grafana, Loki und Tempo.

Zielgrößen pro Großwelt:

- mehr als 2.000 EVUs;
- 200.000 Zugläufe pro Tag;
- rund 20.000 gleichzeitig aktive Züge;
- vorläufig 10.000 gleichzeitige Livemap-Nutzer.

Die Self-Hosting-Topologie steht in `docs/SERVICES.md`.

### 3.2 Öffentliche und interne Verträge

Browser und PWA verwenden eine versionierte REST-API unter `/api/v1` sowie
WebSocket-Deltas unter `/api/v1/live`. OpenAPI, AsyncAPI und JSON Schema sind
die alleinige Vertragsquelle; Clients werden daraus generiert.

Wichtige Typen:

- `WorldRules`, `WorldRelease`, `DisruptionPolicy`;
- `InfrastructureRelease`, `DataProvenance`;
- `OperationalPoint`, `TrackEdge`, `ConflictResource`, `Movement`;
- `Vehicle`, `Formation`, `MaintenanceRequirement`;
- `ServicePattern`, `PathRequest`, `PathOffer`, `PathAllocation`;
- `OccupationProfile`, `TrainRun`, `RuntimeState`;
- `Incident`, `Restriction`, `DispatchDecision`;
- `Tender`, `Bid`, `TransportContract`;
- `LedgerEntry`, `Entitlement`.

API-Regeln:

- Zustandsändernde Befehle benötigen `Idempotency-Key`, `worldId` und erwartete
  Objektversion.
- IDs sind UUIDv7; Zeit wird intern als UTC plus explizite IANA-Zeitzone
  geführt.
- Geld verwendet ISO-Währung und feste Dezimalwerte beziehungsweise ganzzahlige
  Untereinheiten.
- Events enthalten Event-ID, Welt-ID, Aggregate-Version, Korrelations-ID und
  Schema-Version.
- Fehlerantworten liefern stabilen Fehlercode, Ursache und zulässige nächste
  Aktionen.
- Beim Launch existiert keine öffentliche schreibende Bot-API.
- Eine spätere Entwickler-API beginnt read-only und steht allen Spielern unter
  gleichen Regeln offen.

Provider-Schnittstellen kapseln externe Abhängigkeiten:

- `InfrastructureProvider`;
- `TariffProvider`;
- `DisruptionProvider`;
- `DemandCalibrationProvider`;
- `BackofficeBridge`.

Kein externer Provider darf Simulation, Login oder Ledger synchron blockieren.

### 3.3 Authentifizierung, Sicherheit und Weltisolation

- Keycloak ist der eigenständige OIDC-Identity-Provider.
- Das Game-System ist Source of Truth für Spielerstatus, Weltzugänge und EVUs.
- Jede Datenbankabfrage und jedes Event trägt eine `world_id`.
- Autorisierung erfolgt serverseitig; der Browser erhält niemals versteckte
  Wettbewerbsdaten.
- Administrative Aktionen sind rollenbasiert, auditiert und bei
  Hochrisikoaktionen vier-Augen-fähig.
- Rate Limits, Anti-Bot-Prüfungen und Anomalieerkennung schützen Trassenfenster
  und Märkte.
- Backups erreichen RPO ≤ 5 Minuten und RTO ≤ 30 Minuten.
- Ziel-SLO für Game API und Livemap: 99,9 % monatlich.

## 4. Odoo, Monetarisierung und KI-first-Entwicklung

### 4.1 Odoo Community

Odoo Community läuft selbst gehostet und vollständig getrennt vom Spiel.

Odoo verwaltet:

- Kontakte und Rechnungsempfänger;
- Produkte, Zahlungen und Erstattungen;
- Support, CRM und Helpdesk;
- freiwillige Abonnements und Kosmetikprodukte;
- read-only Projektionen von Spielern und Welten;
- auditierte administrative Befehle.

Das Game-System verwaltet:

- Loginberechtigungen und Spielerstatus;
- Welten, EVUs, Fahrzeuge und Verträge;
- Fahrpläne, Trassen und Simulation;
- Wirtschaft, Credits und Entitlements;
- operative Historie und Auditlog.

Integration:

- Game-Outbox → Odoo-Bridge → Odoo;
- Odoo-Webhook → signierter Receiver → Queue →
  Game-Command/Entitlement-API;
- ein nächtlicher Reconciler erkennt verlorene oder doppelte Nachrichten;
- Odoo schreibt niemals direkt in Game-Tabellen;
- Odoo-Ausfälle beeinträchtigen weder Login, Simulation, Livemap noch
  bestehende Entitlements;
- OCA-Module werden versionsgepinnt und geprüft;
- ein minimales eigenes Add-on kapselt Webhooks und Adminbefehle;
- es entsteht keine Abhängigkeit von einer extern nicht verfügbaren
  Enterprise-/Custom-API.

### 4.2 Monetarisierung ohne Pay-to-win

#### Kostenlos

- vollständiger Zugang zu SPFV, SGV und SPNV;
- ein EVU in einer gleichzeitig aktiven öffentlichen Welt;
- alle entscheidungsrelevanten Daten, Solver, Exporte, Warnungen und
  Automationen;
- gleiche Trassen-, Gebots-, Markt- und Berechnungsregeln;
- keine Werbung in der Betriebsoberfläche.

#### Zugfolge Plus

Startpreis: 7,99 € monatlich beziehungsweise 79 € jährlich.

- bis zu drei gleichzeitig aktive Weltplätze, aber niemals mehrere eigene EVUs
  in derselben Welt;
- zusätzliche rein visuelle Dashboard-Anordnungen und Kartenstile;
- erweiterte Firmenprofile, Lackierungen, Logos und kosmetische Marker;
- filmische Replay- und Präsentationsexporte derselben Daten;
- zusätzliche externe Zustellkanäle für zeitgleich auch kostenlos verfügbare
  Meldungen;
- automatisch formatierte PDF-Geschäftsberichte;
- bevorzugter Helpdesk ohne Bevorzugung spielinterner Vorgänge.

Weitere Erlöse:

- direkt kaufbare Kosmetikpakete für 2,99–12,99 €;
- private, ungewertete Welten ab 19,99 € monatlich für den Host;
- Gründer-/Supporterpakete mit kosmetischem Abzeichen, Soundtrack und
  Namensnennung;
- keine Lootboxen, Echtgeld-Spielwährung, Energie, Wartezeitverkürzung oder
  handelbaren Premiumobjekte.

In öffentlichen Welten bleiben sämtliche zustandsverändernden Automationen
kostenlos. Bezahlte erweiterte Automatisierung ist ausschließlich in privaten,
ungewerteten Welten zulässig. Planner, Nachfrage, Wirtschaft,
Trassenvergabe und Live-Disposition dürfen technisch kein Payment-Tier-Feld
erhalten.

### 4.3 KI-first-Repository und Arbeitsweise

Zielstruktur:

```text
/apps/web
/apps/game-server
/apps/simulation-runtime
/apps/live-gateway
/apps/data-pipeline
/integrations/odoo
/packages/contracts
/packages/design-system
/spec
/tests
/infra
```

Werkzeuge:

- Gradle Kotlin DSL für JVM-Code;
- pnpm Workspaces für TypeScript;
- uv für Python;
- trunk-based Development, kurze Branches, geschütztes `main`,
  Squash-Merges.

Autoritätsreihenfolge:

1. Sicherheits- und Agentenregeln;
2. Produktverfassung und Invarianten;
3. freigegebene Domänenspezifikationen;
4. ADRs;
5. OpenAPI-/AsyncAPI-/Schema-Verträge;
6. Feature-Spezifikation mit Given/When/Then;
7. Issue-Auftrag;
8. Tests und bestehender Code.

Chats und Agentengedächtnis sind keine Wahrheitsquelle. Jede Agentensitzung
startet aus Repository, Issue und Spezifikation.

Verbindliches Issue-Format:

```text
Ergebnis/Nutzen:
Autoritative Spec- und ADR-IDs:
Risiko: R0 | R1 | R2 | R3
In Scope / Out of Scope:
Erlaubte Pfade / verbotene Änderungen:
Betroffene Invarianten und Verträge:
Akzeptanzszenarien:
Fehler-, Migrations- und Rollbackverhalten:
Observability:
Security, Datenschutz und Datenlizenz:
Erforderliche Tests:
Definition of Done:
```

Standard-Implementierungsprompt:

```text
Rolle: Implementierungsagent für <Modul>.
Ziel: Implementiere ausschließlich <Feature-ID>.
Lies zuerst AGENTS.md, Produktverfassung, Glossar, genannte Specs,
ADRs und Verträge vollständig.

Unverhandelbare Invarianten:
<aus der Feature-Spezifikation übernehmen>

Erlaubte Pfade:
<explizite Liste>

Verboten:
- neue Produktregeln erfinden
- öffentliche Verträge ohne Spec-/ADR-Änderung verändern
- Tests entfernen oder lockern
- ungeprüfte Laufzeitabhängigkeiten hinzufügen
- Geheimnisse oder Produktionsdaten verwenden

Lieferumfang:
Code, Tests, Migrationen, Telemetrie und Dokumentationsänderungen.

Prüfung:
<exakte lokalen CI-Kommandos>

Stoppe und melde einen Spec-Konflikt, sobald Quellen widersprüchlich,
unvollständig oder nicht entscheidungsfähig sind.
```

Agentenworkflow:

```text
Spec-Agent
  → Domänen-/Architekturreview
  → Implementierungsagent
  → Verifikationsagent
  → Security-Review
  → Release-Agent
```

Der Implementierungsagent darf seine eigene Änderung nicht final freigeben.
Domänenlogik, APIs, Migrationen, Auth, Zahlung und Simulationsinvarianten
benötigen mindestens zwei unabhängige Reviews sowie bei hohem Risiko eine
menschliche Freigabe.

## 5. Tests, Abnahme und Lieferfolge

### 5.1 Verbindliche Qualitätsgates

Die folgende Liste ist das vollständige Zielgate für produktionsreife
Änderungen. Die Foundation-CI setzt derzeit Build, Typprüfung, Lint,
Vertrags-/Domänentests, Python-Kerneltests, CodeQL-SAST, Secret- und
Dependency-Prüfung sowie einen maschinenlesbaren Lizenz-Metadatencheck um.
Solange insbesondere Coverage-/Mutation-Gates, Container-Scan, vollständige
SBOM und Signatur fehlen, ist ein Produktionsrelease ausdrücklich nicht
freigegeben.

Jeder Pull Request besteht:

- Spec-, Referenz- und Schema-Lint;
- Kotlin-/TypeScript-Kompilierung ohne neue Warnungen;
- Formatierung, statische Analyse und API-Kompatibilitätsprüfung;
- mindestens 90 % Changed-Line-Coverage;
- mindestens 90 % Branch-Coverage in Simulation, Fahrplan und Wirtschaft;
- Mutation Score ≥ 75 % in kritischen Domänenmodulen;
- deterministischer Replay-Test bei Simulationsänderungen;
- SAST, Secret-, Dependency-, Container- und Lizenzscan;
- CycloneDX-SBOM und signierte Release-Artefakte;
- unabhängiges adversariales Review;
- frischer reproduzierbarer Build.

Pflichtszenarien:

- Block-, Fahrstraßen-, Bahnsteig- und Gegenfahrtkonflikte;
- Überholung, Zuglänge, Räumzeit und Durchrutschweg;
- Verspätungsfortpflanzung und Regionsübergabe;
- Fahrzeug-, Wartungs-, Abstell- und Personalumlauf;
- SPFV-Nachfrage, SGV-Vertrag und SPNV-Ausschreibung;
- Ledger-Ausgleich, Refund, Insolvenz und Wiederanlauf;
- Import-Idempotenz, Datenprovenienz und Lizenzmanifest;
- realistische, simulierte und manuelle Störungen;
- Provider- und Odoo-Ausfall ohne Stillstand der Simulation;
- No-Pay-to-win-Invarianz zwischen Free und Plus;
- Tastaturbedienung, WCAG AA und reduzierte Bewegung;
- Wiederherstellung aus Snapshot plus Eventlog.

Leistungsabnahme:

- keine inkompatible Doppelbelegung in Property-, Fuzz- und Soak-Tests;
- gleicher Snapshot plus Eventlog ergibt identischen State-Hash;
- reguläre Planung unter 15 Minuten, harter Grenzwert 30 Minuten;
- Ad-hoc p95 unter 5 Sekunden einfach und unter 30 Sekunden komplex;
- lokale Livemap-Aktualität p95 unter 2 Sekunden;
- deutschlandweite Übersicht unter 10 Sekunden;
- 200.000 Zugläufe/Tag und 20.000 aktive Züge im Großweltlasttest.

### 5.2 Roadmap

Die frühere Unterteilung in sechs große Zeitblöcke war für einzelne
KI-Arbeitsaufträge nicht präzise genug. Die aktive Lieferplanung verwendet
deshalb acht evidenzbasierte Release-Gates und 43 einzeln startbare
Meilensteine:

| Gate | Ergebnis |
|---|---|
| `RG-0` | Foundation und entscheidungsfähige Toolchain |
| `RG-1` | dauerhafter, authentifizierter Technical Alpha |
| `RG-2` | datenbasierter Operational Alpha im Pilotnetz |
| `RG-3` | SPFV, SGV und SPNV als vollständiger Game Alpha |
| `RG-4` | mehrwöchig betriebener geschlossener Pilot |
| `RG-5` | Deutschland-Coverage und kontrollierte öffentliche Beta |
| `RG-6` | eingefrorener und vollständig geprüfter Release Candidate |
| `RG-7` | Full Release 1.0 nach 30 Tagen Produktionsstabilisierung |

Die lesbare Roadmap steht in [`docs/ROADMAP.md`](docs/ROADMAP.md). IDs,
Abhängigkeiten, Status, Risikoklasse, Scope, Exit-Kriterien, Prüfungen und
menschliche Gates werden ausschließlich in
[`planning/milestones.yaml`](planning/milestones.yaml) gepflegt.

Ein Meilenstein ist ein einzeln beauftragbares Ergebnis, aber kein einzelner
Megadiff. Er wird nach dem verbindlichen
[`planning/MILESTONE_PROMPT.md`](planning/MILESTONE_PROMPT.md) zuerst in
freigegebene Specs, ADRs, Verträge und begrenzte Feature-Issues zerlegt.
Abschlussstatus benötigt ein versioniertes Evidence Manifest.

Ein öffentlicher Launch bleibt weiterhin ausgeschlossen, solange SPFV, SGV,
SPNV oder einer der Modi `REALISTIC`, `SIMULATED` und `MANUAL` nicht auf dem
exakten Release Candidate geprüft ist.

### 5.3 Verbindliche Annahmen

- „ORM“ bezeichnet OpenRailwayMap.
- Deutschland und EUR sind der erste Markt; die Architektur ist
  internationalisierbar.
- Öffentliche Welten sind persistent, laufen in 1:1 und enthalten nur
  Spielerzüge.
- Zugfolge bildet eine intern realistische Gegenwartswelt ab, nicht den realen
  deutschen Fahrplan.
- Pilotwelten verwenden simulierte Störungen; realistische Welten werden erst
  mit gesicherten Feedrechten aktiviert.
- Fehlende Infrastrukturinformationen werden sichtbar und konservativ
  behandelt.
- Odoo Community bleibt Backoffice und wird niemals Teil des
  Simulationspfads.
- Öffentliche Wettbewerbswelten verkaufen keine spielwirksame Automatisierung.
- KI erzeugt den überwiegenden Code-, Test- und Dokumentationsumfang;
  Rechts-, Eisenbahnbetriebs-, Zahlungs-, Datenschutz- und
  Produktionsfreigaben bleiben menschliche Gates.

## 6. Umsetzungsstand

### Fertig in der Foundation

- Repository-Agentenregeln und Autoritätsreihenfolge;
- Produktverfassung, Glossar und erste ADRs;
- OpenAPI-/AsyncAPI-/JSON-Schema-Verträge für den Walking Skeleton;
- responsive Darkmode-Leitstellen-Demo mit Block-Z;
- Pilotregion Leipzig–Halle–Erfurt als lokale, schematische Datenfixture;
- sichtbare Züge aus SPFV, SGV und SPNV;
- UI für `REALISTIC`, `SIMULATED` und `MANUAL`;
- ausführbarer Referenz-Domänenkern mit Invariantentests;
- GitHub-Issue- und Pull-Request-Vorlagen;
- Lizenzentscheidungsvorlage und Self-Hosting-Dienstekatalog.

### Nächster implementierbarer Slice

Der nächste technische Meilenstein ist `MS-002`: reproduzierbare
TypeScript-, Kotlin/JVM-21- und Python-Toolchains mit einheitlichen lokalen und
CI-Prüfungen. Danach folgt:

1. `MS-003`: Laufzeit-, Modul-, Zeit- und Replay-Entscheidungen;
2. `MS-010`: `FEAT-0001` als deterministischer In-Memory-JVM-Vertical-Slice;
3. `MS-004`: produktive Persistenz-/Eventing-ADRs und kleinster lokaler
   State-Stack;
4. `MS-011`: dauerhafte Transaktionen, Outbox, Snapshots und Recovery;
5. `MS-012` und `MS-013`: Authentifizierung, Weltisolation und echte
   Browser-/Livemap-Integration.

Diese Reihenfolge beweist zuerst die Domäneninvarianten. PostgreSQL, NATS,
Keycloak, Odoo und weitere Dienste werden erst mit ihrem ersten tatsächlichen
Consumer eingeführt. `MS-001` für Rechte, Lizenz, Marke und Quellenfreigaben
läuft als menschlich geführter Paralleltrack.
