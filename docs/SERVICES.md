# Dienste- und Self-Hosting-Landkarte

**Status:** Zielarchitektur, versioniert mit dem Gesamtplan  
**Grundsatz:** Self-hosting wird bevorzugt; externe Anbieter sind austauschbare
Provider und dürfen Simulation, Login oder Ledger nicht synchron blockieren.

## Was die aktuelle Demo benötigt

Der heutige UI-Vertical-Slice benötigt nur Node.js. Die angezeigte Pilotkarte
ist bewusst eine lokale, schematische Darstellung ohne fremde Karten- oder
Trackingdienste. Sie behauptet weder echte aktuelle Belegungen noch eine
produktive OSM-Abdeckung.

### Aktuell verbundener Demo-Hostingpfad

Das Repository enthält `.openai/hosting.json` sowie einen
Cloudflare-kompatiblen vinext-/wrangler-Buildpfad. Diese Verbindung ist
**ausschließlich Entwicklungs- und Demo-Infrastruktur**, nicht die freigegebene
Produktionsplattform:

- erlaubt sind öffentlicher Build-Output und die synthetische UI-Fixture;
- nicht erlaubt sind Spieleraccounts, Providerdaten, Zahlungen, Supportfälle,
  autoritative Welten oder Produktionspersistenz;
- der Pfad besitzt noch keine Produktionsfreigabe für Providerrolle,
  Verarbeitungsregion, Logs, Aufbewahrung, Löschung, DPA, SLO oder Security;
- sein Ausfall darf nur die Demo betreffen;
- die Verbindung ist austauschbar und darf niemals Voraussetzung für
  Simulation, Login, Ledger oder Entitlements werden.

Geheimnisse und die opaque Hosting-Projektkennung werden weder in Doku noch in
Logs wiederholt. Der sichere öffentliche Eintrag steht im
[Rechte- und Diensteregister](../compliance/rights-register.yaml).

## Pflichtdienste für die vollständige Plattform

| Dienst | Aufgabe | Self-host-Vorschlag | Kritikalität |
|---|---|---|---|
| Game Database | Welten, EVUs, Fahrplan, Ledger, Outbox | PostgreSQL + PostGIS | kritisch, Source of Truth |
| Infrastructure Database | versionierte Graphen, Geometrien, Provenienz | getrenntes PostgreSQL + PostGIS | kritisch für Planung |
| Identity | OIDC, MFA, Sessions | Keycloak | kritisch für neue Logins; aktive Simulation unabhängig |
| Eventing | Outbox-Verteilung, Livemap- und Integrationsereignisse | NATS JetStream | kritisch, aber mit DB-Outbox wiederherstellbar |
| Object Store | Rohdaten, Releases, Snapshots, kalte Events | MinIO/Ceph oder S3-kompatibel | kritisch für Restore und Releases |
| Cache | Presence, Rate Limits, kurzlebige Caches | Redis/Valkey | degradierbar, nie Source of Truth |
| Game API | REST, Commands, Autorisierung | Kotlin/JVM-21 modularer Monolith | kritisch |
| Simulation Runtime | regionale Single Writer | Kotlin/JVM-21 Prozess | kritisch |
| Live Gateway | Snapshot plus Sequenz-Deltas | eigener WebSocket-Dienst | kritisch für Live-UX, nicht für Simulation |
| Payment | Abos, Kosmetik, private Welten, Refunds und Reconciliation | austauschbarer externer Provider, noch nicht gewählt | neue Käufe degradierbar; bestehende Entitlements unabhängig |
| Externe Meldungszustellung | optionale E-Mail-/Push-Kopie des kostenlosen Ingame-Postfachs | austauschbarer externer Provider, noch nicht gewählt | vollständig degradierbar |
| Observability | Metriken, Traces, Logs, SLOs, Alarme und Incident-Evidenz | OpenTelemetry, Prometheus, Grafana, Loki und Tempo | betriebskritisch, nie Source of Truth |

Game-, Infrastruktur- und Odoo-Datenbanken müssen getrennte Credentials,
Schemas, Backups und Restore-Tests besitzen.

## Einführung nach tatsächlichem Bedarf

Die Zielarchitektur ist keine Erlaubnis, alle Dienste bereits im Walking
Skeleton zu installieren. Die aktive
[Full-Release-Roadmap](ROADMAP.md) führt sie just in time ein:

| Meilenstein | Erst dann eingeführter Dienst |
|---|---|
| `MS-004` | PostgreSQL/PostGIS und S3-kompatibler Object Store nach akzeptierten Persistenz-ADRs |
| `MS-012` | Keycloak für die reale OIDC- und Weltisolationsgrenze |
| `MS-013` | NATS JetStream für den ersten echten Outbox-Consumer; Valkey nur bei gemessenem Cache-/Presence-Bedarf |
| `MS-022` | Planetiler, PMTiles/MBTiles und optional Martin für die eigene Dark-Map |
| `MS-052` | Odoo Community und seine getrennte Datenbank |
| `MS-053` | geprüfter Zahlungsprovider und nur bei Produktbedarf optionale externe Meldungszustellung |
| `MS-055` | vollständiger OpenTelemetry-/Prometheus-/Grafana-/Loki-/Tempo-Betriebsstack |
| `MS-061` bis `MS-062` | regionale Prozesse und weitere Skalierungskomponenten nur nach Lastnachweis |

`MS-010` beweist `FEAT-0001` vorher mit deterministischen, ausdrücklich nicht
produktiven In-Memory-Adaptern. Dadurch werden PostgreSQL, NATS, Keycloak, Odoo
und Kartendienste nicht zu versteckten Voraussetzungen für die Domänenlogik.

## Empfohlener eigener Kartenstack

```text
genehmigter OSM-PBF-Extract
        │
        ├── osmium/GDAL/Polars ──> Infrastruktur-Release in PostGIS
        │
        └── Planetiler ──────────> versionierte PMTiles/MBTiles
                                      │
                           Object Store + CDN/Cache
                                      │
                               MapLibre GL JS
```

Für dynamische PostGIS-Layer oder das Zusammenführen mehrerer Tile-Quellen ist
**Martin** die bevorzugte optionale Serving-Schicht. Martin kann Vector Tiles
direkt aus PostGIS, PMTiles, MBTiles und GeoJSON ausliefern. Für weitgehend
statische Basiskarten ist ein versioniertes PMTiles-Archiv im Object Store
einfacher und besser cachebar.

Offizielle Dokumentation:

- [MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/)
- [Martin Tile Server](https://maplibre.org/martin/)
- [Planetiler](https://github.com/onthegomap/planetiler)

### Nicht verwenden

- öffentliche `tile.openstreetmap.org`-Tiles für Produktion, Massennutzung,
  Vorabruf oder Offlinepakete;
- öffentliche OpenRailwayMap-Tiles als Produktbackend;
- fremde Tile-URLs ohne dokumentierte Nutzungsrechte, SLA und
  Attribution;
- Live-Abfragen gegen OSM als Teil des Simulationspfads.

Die OSM Foundation erklärt ausdrücklich, dass ihre Tile-Server keine
allgemeine, SLA-gestützte Drittanbieterplattform sind und empfiehlt für
entsprechende Last Self-hosting oder einen geeigneten Anbieter:
[OSM Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/).

### Attribution

Jede interaktive Karte mit OSM-Daten zeigt gut lesbar und nahe an der Karte
„© OpenStreetMap contributors“ mit Link auf die Lizenzseite. Zusätzlich führt
Zugfolge eine Datenlizenzansicht mit Release, Quelle und Ableitungen.

Maßgeblich sind:

- [OpenStreetMap Copyright and License](https://www.openstreetmap.org/copyright)
- [OSMF Attribution Guidelines](https://osmfoundation.org/wiki/Licence/Attribution_Guidelines)

## Suche und Geocoding

**Nominatim ist optional**, nicht Teil der Trassenberechnung. Es kann für
Orts-/Bahnhofssuche selbst gehostet werden. Betriebssuche innerhalb eines
Infrastruktur-Releases sollte primär aus dem eigenen Operational-Point-Index
kommen, damit Version und Bahnsemantik eindeutig bleiben.

Bei Self-hosting von Nominatim sind eine separate PostGIS-Instanz,
Update-Prozess, Rate Limits und Monitoring einzuplanen:
[Nominatim Installation](https://nominatim.org/release-docs/develop/admin/Installation/).

## Datenpipeline und externe Quellen

Die technische Nennung einer Quelle ist keine Freigabe. Der verbindliche,
maschinenlesbare Status steht im
[Rechte- und Quellenregister](../compliance/rights-register.yaml); die
Begründungen stehen im
[Source Risk Memo](legal/SOURCE-RISK-MEMO.md).

| Quelle/Provider | Geplante Verwendung | Vorbereitungsentscheidung |
|---|---|---|
| versionierter OpenStreetMap-PBF-Extract | Geometrie und OSM-Railway-Tags | Human-/ODbL-Prüfung erforderlich; Extract-Anbieter offen |
| OpenRailwayMap-Taggingdokumentation | Interpretation von OSM-Tags | nur Dokumentationshilfe; kein separater Datenprovider |
| OpenStation | Stationsinfrastruktur | Freigabekandidat; exakte Version, Mobilithek/API-Weg und Feldmapping offen |
| StaDa | Stationsstammdaten | Freigabekandidat; CC BY 4.0, Marketplace, Abruflimit und OSM-Kombination prüfen |
| RINF | Infrastrukturattribute | blockiert bis schriftliche Wiederverwendungsentscheidung |
| pathOS/TPN | keine Produktverwendung | ohne neue Berechtigung und Vertrag ausgeschlossen |
| Trassenfinder | keine Engine-, Tarif-, Speicher- oder Kalibrierungsverwendung | ausgeschlossen; Disclaimer erlaubt nur zeitnahe Einzelrouten |
| Bau-/Störungsfeeds | nur `REALISTIC`-Welten | `CONTRACT_REQUIRED`, an `MS-039` und Full Release gebunden |
| TPS/SPS/APS/INB und Anlagen-/Stationspreise | versionierte Entgeltregeln | Fakten, Formeln, Archivierung, Extraktion und Weitergabe je Periode prüfen |
| öffentliche OSM-/ORM-Tiles und öffentliches Nominatim | keine Produktverwendung | ausgeschlossen; eigene Tiles, optional eigenes Geocoding |

Jeder Import schreibt `DataProvenance`: Quell-ID, Lizenz/Vertrag,
Abrufzeitpunkt, Gültigkeit, Schema-Version, Checksumme, Transformation und
Confidence. Ein Provider-Ausfall darf keinen stillen Wechsel von `REALISTIC` zu
`SIMULATED` auslösen.

Bis zur Freigabe erfolgt kein Live-Import und keine Providerantwort wird als
Fixture oder Golden File committed. Der aktuelle Pilot bleibt synthetisch.
Die maschinenlesbare `releaseCoverage` im Register ordnet zusätzlich jeden
Meilenstein von `RG-0` bis `RG-4` seinen benötigten Quellen und Diensten zu.

## Backoffice

Odoo Community ist optional für den ersten Walking Skeleton und erforderlich
für die geplanten Backoffice-Prozesse:

- Kontakte und Rechnungsempfänger;
- Produkte, Zahlungsvorgänge und Erstattungen;
- CRM, Helpdesk und Support-SLAs;
- read-only Projektionen von Spielern und Welten;
- auditierte Adminbefehle über die Bridge.

Es erhält eine **eigene PostgreSQL-Datenbank**. Die Verbindung verläuft nur über
Game-Outbox/Bridge sowie signierte Webhooks und Queues. Odoo schreibt niemals
direkt in Spieltabellen.

## Observability und Betrieb

Für Produktion:

- OpenTelemetry Collector;
- Prometheus;
- Grafana;
- Loki;
- Tempo;
- Alertmanager oder kompatibler Alarmkanal;
- Secret Store, beispielsweise SOPS + age oder Vault;
- OCI Registry mit Signaturprüfung;
- Reverse Proxy/WAF, TLS und DDoS-Schutz;
- Offsite-Backups und regelmäßige Restore-Übungen.

ClickHouse und Kubernetes werden erst eingeführt, wenn Messwerte ihren Bedarf
belegen. Für Pilotwelten ist ein nachvollziehbares Container-Deployment auf
wenigen Hosts einfacher zu betreiben und zu restaurieren.

## Lokale Entwicklungsprofile

Geplant sind drei Compose-Profile:

1. `core`: PostgreSQL/PostGIS, NATS, Object Store, Redis;
2. `identity`: zusätzlich Keycloak;
3. `backoffice`: zusätzlich Odoo und Bridge.

Container-Images müssen auf unveränderliche Versionen oder Digests gepinnt
werden. Beispielpasswörter gehören nur in `.env.example`; echte Geheimnisse
werden nie committed.

## Noch nicht freigegeben

Die folgenden Entscheidungen bleiben bewusst offen und dürfen von einem
Implementierungsagenten nicht erfunden werden:

- konkreter OSM-Extract-Anbieter und Aktualisierungsrhythmus;
- zulässige InfraGO-/Trassenfinder-Speicher- und Abrufverträge;
- produktiver Zahlungsdienstleister;
- E-Mail/SMS/Push-Anbieter;
- CDN-/DDoS-Anbieter;
- Rechtsgrundlage und Aufbewahrung jedes externen Störungsfeeds;
- Hardware-Sizing für Deutschland-Releases und 20.000 aktive Züge.
