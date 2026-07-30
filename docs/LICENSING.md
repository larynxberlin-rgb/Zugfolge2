# Lizenzentscheidung für Zugfolge

**Status:** Entscheidungsvorlage, keine Rechtsberatung

**Stand:** 30. Juli 2026

**Entscheidung:** offen; Repository bleibt `UNLICENSED`

Diese Datei empfiehlt eine Richtung. Sie erteilt keine Lizenz und ersetzt weder
die Rechtekettenprüfung noch eine qualifizierte juristische Freigabe.

## Aktueller Zustand

Es gibt bewusst keine Root-`LICENSE`. Sämtliche Paketmetadaten bleiben
`UNLICENSED`, externe Beiträge sind geschlossen, und kein Kandidat im
[Rechte- und Quellenregister](../compliance/rights-register.yaml) ist durch die
Projektseite freigegeben.

Das ist wichtig, weil eine später wirksam veröffentlichte Open-Source-Lizenz für
bereits empfangene Fassungen nicht einfach rückwirkend zurückgenommen werden
kann. Vor dem ersten lizenzierten Commit müssen daher Rechteinhaber,
KI-/Drittcode-Provenienz, Beitragssystem und Lizenzumfang feststehen.

## Empfohlene Richtung

Wenn der Projekteigner erlaubt, dass Dritte Zugfolge kommerziell hosten, sofern
sie Änderungen an öffentlich angebotenen Fassungen wieder offenlegen, ist
**`AGPL-3.0-or-later`** die passendste Kernlizenz.

Die AGPL adressiert Netzwerksoftware: Wer eine veränderte Fassung über ein Netz
zur Nutzung anbietet, muss interagierenden Nutzern den korrespondierenden
Quellcode anbieten. Sie erlaubt kommerzielle Nutzung, Abonnements, Support und
Hosting. Sie verbietet jedoch keinen konkurrierenden Dienst, wenn dieser die
Lizenz einhält.

Offizielle Grundlagen:

- [GNU Affero General Public License 3.0](https://www.gnu.org/licenses/agpl-3.0.html)
- [GNU FAQ zu Netzwerkinteraktion und AGPL](https://www.gnu.org/licenses/gpl-faq.en.html)
- [SPDX `AGPL-3.0-or-later`](https://spdx.org/licenses/AGPL-3.0-or-later.html)

Die Versionsfrage ist eine bewusste Eigentümerentscheidung:
`AGPL-3.0-or-later` erlaubt Empfängern die Nutzung späterer AGPL-Versionen;
`AGPL-3.0-only` hält jede spätere Versionsfreigabe beim Rechteinhaber.

## Empfohlenes Lizenzmosaik nach Freigabe

| Bestandteil | Kandidat | Noch erforderliches Gate |
|---|---|---|
| Webclient, Game-Server, Simulation, Datenpipeline, Live-Gateway, Odoo-Bridge | `AGPL-3.0-or-later` | Rechteinhaber und Softwarelizenzprüfung |
| öffentliche OpenAPI-/AsyncAPI-/JSON-Schema-Verträge und SDKs | `Apache-2.0` | klare Abgrenzung zum Kern und Patent-/Notice-Prüfung |
| Specs, ADRs, Planung und originale Dokumentation | `CC-BY-4.0` | Rechteinhaber und eindeutige Codebeispiel-Regel |
| rein synthetische, eigens erzeugte und geprüfte Fixtures | optional `CC0-1.0` | Herkunft und menschliche Freigabe jedes Fixtures |
| OSM-abgeleitete Infrastruktur-Datenbank | `ODbL-1.0` | Datenbankklassifikation, Attribution und Bereitstellungsprozess |
| eigener Kartenstil und Rendering-Code | Kernlizenz; Marke ausgenommen | Asset-/Abhängigkeitsprüfung |
| Zugfolge, Block-Z, Claim, Logos, Kosmetik, Soundtrack | alle Rechte vorbehalten; separate Marken-/Asset-Regel | Eigentum, Marken- und Assetprüfung |
| Spieler-, Welt-, Ledger- und Accountdaten | Betriebsdaten, nicht Teil der Code-Lizenz | AGB-, Datenschutz- und Vertragsprüfung |
| Drittanbieter-Feeds, Fonts und Medien | jeweilige Lizenz oder Vertrag | Einzelentscheidung im Register |

Apache-2.0 ist für öffentliche Integrationsverträge geeignet, weil sie
permissiv ist und einen ausdrücklichen Patentgrant enthält:
[offizieller Apache-2.0-Text](https://www.apache.org/licenses/LICENSE-2.0.txt).

Creative Commons empfiehlt ihre Lizenzen nicht als Softwarelizenz. Für
Dokumentation ist CC BY 4.0 ein geeigneter Kandidat, erteilt aber keine Patent-
oder Markenrechte:
[CC FAQ](https://creativecommons.org/faq/) und
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/legalcode).

## EUPL-1.2 als EU-orientierte Alternative

**`EUPL-1.2`** ist die stärkste Alternative, falls die deutsche/EU-rechtliche
Prüfung sie bevorzugt. Sie erfasst die Bereitstellung wesentlicher
Funktionalität über ein Netz, enthält Patentregeln und existiert in offiziellen
EU-Sprachfassungen.

Trade-off: Die EUPL ist im internationalen Entwickler- und
Hosting-Ökosystem weniger geläufig; ihre Kompatibilitätsklausel erfordert eine
genaue Prüfung kombinierter Werke.

- [Offizieller EUPL-1.2-Text](https://eupl.eu/1.2/en)
- [Interoperable Europe EUPL-Portal](https://interoperable-europe.ec.europa.eu/licence/european-union-public-licence-version-12-eupl)

## Proprietär oder Dual Licensing

Eine proprietäre Lizenz ist die konsequente Wahl, wenn ausschließlich der
Rechteinhaber einen öffentlichen oder kommerziellen Zugfolge-Dienst betreiben
darf. Dann sollte das Entwicklungsrepository privat sein, bevor weitere
schutzbedürftige Inhalte entstehen. Öffentliche Kopien oder Forks, die bereits
im Rahmen der GitHub-Nutzungsfunktionen entstanden sind, verschwinden durch eine
spätere Privatisierung nicht automatisch.

Dual Licensing – beispielsweise AGPL plus kommerzielle OEM-Lizenz – ist erst
sinnvoll, wenn ein echtes Self-hosting-/OEM-Geschäft existiert. Dafür muss der
Rechteinhaber Relizenzierungsrechte an allen Beiträgen kontrollieren. Ein DCO
allein genügt dafür typischerweise nicht; vor dem ersten externen Beitrag wäre
ein anwaltlich gestaltetes Individual-/Corporate-CLA erforderlich.

Eine source-available Lizenz wie BSL kann konkurrierendes Hosting zeitweise
einschränken, ist aber bis zum Change Date keine Open-Source-Lizenz. Sie sollte
nicht gewählt werden, wenn Zugfolge glaubwürdig als Open Source auftreten soll.

## OSM ist eine getrennte Datenentscheidung

OSM-Daten stehen unter ODbL, nicht unter der Code-Lizenz. Werden Signale,
Geschwindigkeiten, Blöcke oder Zugsicherung direkt an OSM-Objekte angefügt, kann
die angereicherte Datenbank eine ODbL-`Derivative Database` sein. Eine technische
Tabellentrennung beweist noch keine `Collective Database`.

Darum müssen OSM-abgeleitete, unabhängige Provider- und operative Spieldaten
nachvollziehbar getrennt bleiben, bis ein Datenrechtsexperte die Release- und
Angebotsarchitektur freigibt. Nicht weiterverteilbare Providerdaten dürfen nicht
in ODbL-Angebote, Tiles, Fixtures oder Exporte durchsickern.

- [OpenStreetMap Copyright and License](https://www.openstreetmap.org/copyright)
- [ODbL-1.0](https://opendatacommons.org/licenses/odbl/1-0/)
- [OSMF Attribution Guidelines](https://osmfoundation.org/wiki/Licence/Attribution_Guidelines)

## Beiträge

Für eine reine AGPL-Strategie ist die Ausgangsempfehlung:

- inbound equals outbound;
- DCO 1.1 mit `Signed-off-by`;
- Offenlegung von KI-Unterstützung und verantwortlicher menschlicher Prüfung;
- Bestätigung, dass keine vertraulichen Daten, fremden Assets oder ungeklärten
  generierten Bestandteile eingereicht werden.

Der DCO ist eine Herkunftsbestätigung, keine eigene Lizenz und kein Ersatz für
eine erforderliche Rechteübertragung:
[Developer Certificate of Origin 1.1](https://www.eclipse.org/legal/dco/).

Bis die Entscheidung umgesetzt und technisch erzwungen ist, werden keine
externen Beiträge angenommen.

## Verbindliche Human-Gates

Vor einer Root-Lizenz müssen Menschen dokumentiert entscheiden:

1. Wer ist Lizenzgeber, Markeninhaber und Vertragspartner?
2. Darf ein Dritter einen kommerziellen offenen Fork betreiben?
3. Reicht die Rechtekette aller bisherigen menschlichen und KI-unterstützten
   Commits, Texte und Assets?
4. `AGPL-3.0-or-later`, `AGPL-3.0-only`, EUPL oder proprietär?
5. DCO oder CLA; Single- oder Dual-Licensing?
6. Welche Datenbank ist ODbL-Derivative, Collective Database oder nicht
   veröffentlichbar?
7. Sind sämtliche Runtime-, Build-, CI-, Font- und Containerlizenzen kompatibel?
8. Sind Name, Block-Z, Claim und Domain freigabefähig und in wessen Eigentum?
9. Welche separaten AGB, Datenschutz-, Zahlungs-, Moderations- und API-Regeln
   benötigt der Dienst?

Die ausführbaren Teilpakete und Rollback-Grenzen stehen im
[MS-001-Kickoff](../planning/MS-001-KICKOFF.md). Bis alle erforderlichen Gates
bestanden sind, gilt weiterhin: **`UNLICENSED`, keine externen Beiträge, keine
Produktivdatenimporte.**
