# Dienste- und Self-Hosting-Landkarte

**Status:** Zielarchitektur, versioniert mit dem Gesamtplan  
**Grundsatz:** Self-hosting wird bevorzugt; externe Anbieter sind austauschbare
Provider und dürfen Simulation, Login oder Ledger nicht synchron blockieren.

## Was die aktuelle Demo benötigt

Der heutige UI-Vertical-Slice benötigt nur Node.js. Die angezeigte Pilotkarte
ist bewusst eine lokale, schematische Darstellung ohne fremde Karten- oder
Trackingdienste. Sie behauptet weder echte aktuelle Belegungen noch eine
produktive OSM-Abdeckung.

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

Game-, Infrastruktur- und Odoo-Datenbanken müssen getrennte Credentials,
Schemas, Backups und Restore-Tests besitzen.

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

| Quelle/Provider | Geplante Verwendung | Laufzeitabhängigkeit | Freigabebedingung |
|---|---|---|---|
| OpenStreetMap/OpenRailwayMap-Tags | Geometrie und offene Bahntags | nein, Release-Import | ODbL, Attribution, Provenienz |
| RINF/OpenStation/StaDa | Attribute und Betriebsstellen | nein, Release-Import | Nutzungsrecht und Mapping geprüft |
| pathOS/TPN | Plausibilisierung/zulässige Daten | nein | Vertrag und Speicherrecht geprüft |
| Trassenfinder | zeitnahe Einzelroute/Plausibilität | nein | Disclaimer und Cachinggrenzen eingehalten |
| Bau-/Störungsfeeds | nur `REALISTIC`-Welten | asynchron | Vertrag, SLA, Fallback und Audit geklärt |
| TPS/SPS/APS/INB | versionierte Entgeltregeln | nein | Quelle archiviert, Rechenbeispiele getestet |

Jeder Import schreibt `DataProvenance`: Quell-ID, Lizenz/Vertrag,
Abrufzeitpunkt, Gültigkeit, Schema-Version, Checksumme, Transformation und
Confidence. Ein Provider-Ausfall darf keinen stillen Wechsel von `REALISTIC` zu
`SIMULATED` auslösen.

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
