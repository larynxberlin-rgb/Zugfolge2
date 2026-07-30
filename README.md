# Zugfolge

> **Plane präzise. Fahre profitabel.**

![Abstrakte Blockbelegung im Zugfolge-Pilotnetz](public/og.png)

Zugfolge ist eine persistente, serverautoritäre
Eisenbahn-Unternehmenssimulation für den Browser. Spieler gründen ein eigenes
Eisenbahnverkehrsunternehmen, planen SPFV- und SGV-Verkehre, bieten auf
SPNV-Ausschreibungen und konkurrieren um dieselbe realistisch modellierte
Schienenkapazität.

Das Projekt befindet sich in der **Foundation-/Walking-Skeleton-Phase**. Die
aktuelle Anwendung ist eine interaktive Leitstellen-Demo mit Pilotdaten für
Leipzig–Halle–Erfurt. Sie zeigt die Produkt- und Designrichtung, ist aber noch
keine produktionsfähige Mehrspielersimulation.

## Was heute bereits ausführbar ist

- responsive Darkmode-Betriebszentrale mit Block-Z-Marke;
- schematische Live-Lage mit Spielerzügen aus SPFV, SGV und SPNV;
- Trasseninspektor mit Blockbelegungen und verständlicher Planner-Entscheidung;
- Umschaltung zwischen realistischen, simulierten und manuellen Störungen;
- dependency-freier Referenz-Domänenkern für exklusive Belegungen,
  deterministische Planung, ausgeglichene Ledger-Einträge und Replay-Hashes;
- versionierte OpenAPI-, AsyncAPI- und JSON-Schema-Verträge;
- Produktverfassung, Glossar, ADRs und Given/When/Then-Feature-Spezifikation.

## Schnellstart

Voraussetzung: Node.js `>=22.13.0`.

```bash
npm ci
npm run dev
```

Danach ist die Anwendung unter `http://localhost:3000` erreichbar.

```bash
npm run lint
npm run test:unit
npm test
```

`npm test` baut die Cloudflare-/vinext-Ausgabe und prüft anschließend sowohl den
gerenderten HTML-Vertical-Slice als auch Verträge, Domäneninvarianten,
Lizenzmetadaten und erkennbare Credential-Leaks. GitHub Actions ergänzt
Dependency-Audit und CodeQL-SAST.

## Repository-Landkarte

```text
/app                         ausführbarer React-/TypeScript-Vertical-Slice
/packages/contracts          OpenAPI, AsyncAPI und JSON Schema
/packages/domain             ausführbarer Referenz-Domänenkern
/spec                        Produktverfassung, Glossar, ADRs, Features
/tests                       Unit- und Render-Tests
/build, /worker              Hosting- und Worker-Adapter
/docs                        Betrieb, Dienste, Lizenzen und Datenquellen
/.github                     Issue- und Pull-Request-Vorlagen
```

Die geplante Zielstruktur mit Kotlin-Game-Server, Simulation Runtime,
Live-Gateway, Datenpipeline und Odoo-Bridge ist im [Gesamtplan](PLAN.md)
festgehalten. Es werden nur Module angelegt, die bereits einen testbaren
Vertical Slice oder einen freigegebenen Vertrag besitzen.

## Die wichtigsten Invarianten

1. Zwei Züge dürfen nie gleichzeitig inkompatible Belegungen derselben
   Konfliktressource besitzen.
2. Gleicher Snapshot plus identische geordnete Events ergeben denselben
   State-Hash.
3. Spielgeld wird ausschließlich in ganzzahligen Untereinheiten und in einem
   unveränderlichen, ausgeglichenen Ledger geführt.
4. Externe Infrastrukturdaten behalten Quelle, Lizenz, Gültigkeit und
   Prüfsumme.
5. Odoo liegt außerhalb des Simulationspfads.
6. Bezahlstatus darf weder Trassenvergabe noch Markt-, Betriebs- oder
   Wirtschaftsergebnis beeinflussen.

Normativ sind [AGENTS.md](AGENTS.md), die
[Produktverfassung](spec/00-product-constitution.md) und die freigegebenen
[Spezifikationen](spec/README.md).

## Karten- und Betriebsdienste

Die Demo benötigt noch keine fremden Laufzeitdienste. Der Vollausbau benötigt
eine bewusst selbst gehostete Karten- und Plattformkette. Die verbindliche
Übersicht mit Pflichtdiensten, Alternativen, Ausfallverhalten und
Lizenzhinweisen steht in [docs/SERVICES.md](docs/SERVICES.md).

Wichtig: Zugfolge verwendet im Produktivbetrieb weder die öffentlichen
OpenStreetMap- noch die öffentlichen OpenRailwayMap-Tiles. Eigene Dark-Vector-
Tiles werden aus genehmigten Daten-Releases erzeugt und mit sichtbarer
Attribution ausgeliefert.

## Lizenzstatus

Für dieses Repository ist bewusst noch **keine Root-Lizenz** gesetzt. Ein
öffentlich sichtbares GitHub-Repository erteilt ohne Lizenz keine allgemeine
Erlaubnis zum Kopieren, Verändern oder Weiterverbreiten. Das Paket ist deshalb
bis zur Entscheidung ausdrücklich als `UNLICENSED` markiert; es gilt
„all rights reserved“.

Die Empfehlung ist **AGPL-3.0-or-later für den Programmcode**, wenn Zugfolge ein
echtes Open-Source-Projekt werden und auch Änderungen an öffentlich betriebenen
Servern zurück in die Gemeinschaft zwingen soll. Markenmaterial, Datenbanken
und Dokumentation brauchen davon getrennte Regeln. Auswirkungen und
Alternativen sind in [docs/LICENSING.md](docs/LICENSING.md) erläutert. Vor der
Entscheidung ist eine anwaltliche Prüfung sinnvoll.

## Mitwirken

Änderungen beginnen mit einer Spezifikation oder einem Issue im verbindlichen
Format. Bitte zuerst [AGENTS.md](AGENTS.md) und die referenzierten Specs
vollständig lesen. Neue Provider, Laufzeitabhängigkeiten, Datenquellen oder
öffentliche Verträge benötigen eine dokumentierte Lizenz-, Sicherheits- und
Ausfallprüfung.

## Projektstatus

- Produktname: **Zugfolge**
- Claim: **Plane präzise. Fahre profitabel.**
- Pilotregion: Leipzig–Halle–Erfurt
- Zielmarkt: Deutschland / EUR / Infrastrukturstand 2026
- Öffentliche Welten: persistent, ausschließlich Spielerzüge, 1:1-Echtzeit
- Repository-Lizenz: **UNLICENSED**, Entscheidungsvorlage vorhanden

Der aktuelle Umsetzungsstand und die nächsten Exit-Kriterien werden im
[Gesamtplan](PLAN.md) und in
[FEAT-0001](spec/features/FEAT-0001-walking-skeleton.md) gepflegt.
