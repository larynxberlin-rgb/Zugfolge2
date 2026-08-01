# Lizenzierung von Zugfolge

**Status:** Lizenzmosaik veröffentlicht; qualifizierte Rechteprüfung offen

**Stand:** 30. Juli 2026

Diese technische Dokumentation ist keine Rechtsberatung. Der Projekteigner hat
die öffentliche Lizenzrichtung festgelegt. Rechtekette, Marken, einzelne
Assets, Datenquellen, Drittanbieterbeilagen und der künftige CLA-Prozess
bleiben menschliche Gates von `MS-001`.

## Verbindliche Dateizuordnung

Die genaue Zuordnung steht in [`REUSE.toml`](../REUSE.toml). Bei einem
Widerspruch haben die dateibezogene SPDX-Zuordnung und der zugehörige Text
unter [`LICENSES/`](../LICENSES/) Vorrang vor zusammenfassender Dokumentation.

| Bestandteil | Behandlung |
|---|---|
| Originaler Programmcode, Tests, Build- und Laufzeitkonfiguration | `AGPL-3.0-or-later` |
| Öffentliche OpenAPI-, AsyncAPI- und JSON-Schema-Verträge, Beispiele und öffentliche SDKs | `Apache-2.0` |
| Originale Spezifikationen, ADRs, Planung und Dokumentation | `CC-BY-4.0` |
| Explizit markierte, noch ungeprüfte Fixtures und Medien | `LicenseRef-Zugfolge-Provenance-Pending`; kein Grant |
| Künftige, gesondert freigegebene OSM-abgeleitete Datenbank-Releases | `ODbL-1.0`; derzeit nur Richtlinie, kein Artefakt |
| Name, Block-Z, Claim, Herkunftshinweise und Auftreten als offizieller Dienst | separate Markenregel |

Der Root-Hinweis [`LICENSE`](../LICENSE) ist bewusst kein einzelner
Gesamtlizenztext. Er verweist auf dieses Lizenzmosaik.

## AGPL für den Programmcode

Zugfolge verwendet für den zugeordneten Programmcode
`AGPL-3.0-or-later`. Die Lizenz erlaubt Nutzung, Änderung, Weitergabe und
kommerziellen Betrieb unter ihren Bedingungen. Bei einer veränderten Fassung,
mit der Nutzer über ein Netz interagieren, ist diesen Nutzern der
korrespondierende Quellcode der tatsächlich betriebenen Fassung anzubieten.

Ein Release und jeder öffentlich erreichbare Build benötigen deshalb:

- den vollständigen AGPL-Text;
- einen sichtbaren Link zum korrespondierenden Quellcode der ausgelieferten
  Version;
- sämtliche erforderlichen Drittanbieterhinweise;
- Build- und Bereitstellungsinformationen im von der AGPL verlangten Umfang.

Offizielle Grundlagen:

- [GNU AGPL 3.0](https://www.gnu.org/licenses/agpl-3.0.html)
- [SPDX `AGPL-3.0-or-later`](https://spdx.org/licenses/AGPL-3.0-or-later.html)

Die Auswahl `-or-later` ist absichtlich. Bereits ordnungsgemäß empfangene
Lizenzrechte werden durch eine spätere Repository-Änderung nicht still
widerrufen.

## Apache-2.0 für öffentliche Verträge

Die Dateien unter [`packages/contracts/`](../packages/contracts/) erhalten
eine permissive Integrationsgrenze unter Apache-2.0 einschließlich des dort
geregelten Patentgrants. Das umfasst die originalen Vertragsquellen,
Vertragsbeispiele und künftig daraus erzeugte öffentliche SDKs. Es lizenziert
weder Serverimplementierungen noch fremde Providerinhalte.

- [Offizieller Apache-2.0-Text](https://www.apache.org/licenses/LICENSE-2.0.txt)

## CC BY 4.0 für Dokumentation

Originale Dokumentation, Spezifikationen, ADRs und Planung sind
`CC-BY-4.0`. Bei Weitergabe sind mindestens Urheberhinweis, Lizenzlink und ein
Hinweis auf Änderungen beizubehalten. Längere ausführbare Codebeispiele sollen
vor einer Wiederverwendung anhand der Dateizuordnung geprüft werden; die
Dokumentationslizenz ersetzt keine Patent- oder Markenfreigabe.

Empfohlene Attribution:

> Zugfolge documentation, © 2026 Zugfolge contributors, licensed under
> CC BY 4.0; changes identified by the redistributor.

- [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)

## Provenienz-pendente Dateien

Die folgenden vorhandenen Dateien sind bis zu einer verantwortlichen
Herkunfts- und Rechteprüfung vom Standard-Grant ausgenommen:

- `app/components/BlockZ.tsx`
- `app/lib/pilot-data.ts`
- `public/favicon.svg`
- `public/og.png`

Sie tragen in `REUSE.toml`
`LicenseRef-Zugfolge-Provenance-Pending`. Dieser Übergangsstatus erteilt keine
Kopier-, Änderungs- oder Weitergaberechte. Er verhindert, dass eine
Root-Standardregel ungeprüfte Markenbestandteile, Bildbestandteile oder
synthetische Testdaten still miterfasst. Ein Full-Release muss diese Dateien
prüfen und standardkonform lizenzieren oder durch nachweislich freigabefähige
Fassungen ersetzen.

Der lokale `vinext`-Build enthält diese Dateien noch, damit der bestehende
Entwicklungsstand testbar bleibt. Er ist damit ausschließlich ein
Evaluationsartefakt. Solange alle vier Dateien nicht freigegeben, ersetzt oder
technisch ausgeschlossen sind, darf dieser Build weder öffentlich deployt noch
als Release verteilt werden.

Damit ist der aktuelle Quellbaum noch kein vollständig offen lizenzierbares
Produktpaket, obwohl die klar abgegrenzten Code-, Vertrags- und
Dokumentations-Scopes bereits öffentliche Grants tragen.

## OSM und ODbL

OSM-Daten stehen unter ODbL und nicht unter der Code-Lizenz. Werden eigene
Attribute direkt an OSM-Objekte angefügt, kann die angereicherte Datenbank eine
ODbL-`Derivative Database` sein. Eine technische Tabellentrennung allein
entscheidet diese Klassifikation nicht.

Im Repository liegt aktuell keine freigegebene OSM-abgeleitete Datenbank. Die
ODbL-Richtlinie dokumentiert die vorgesehene Behandlung eines künftigen,
gesondert geprüften Releases. Ein solches Release braucht unter anderem:

- die genaue OSM-Attribution;
- Provenienz, Snapshot und Transformationsversion;
- die Datenbankklassifikation;
- den jeweils erforderlichen Datenbank- oder Änderungsangebotsprozess;
- eine Prüfung, dass nicht weiterverteilbare Providerdaten ausgeschlossen sind.

- [OpenStreetMap Copyright and License](https://www.openstreetmap.org/copyright)
- [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/)
- [OSMF Attribution Guidelines](https://osmfoundation.org/wiki/Licence/Attribution_Guidelines)

## Marke und offizieller Dienst

Eine Copyright-Lizenz erteilt keine Markenfreigabe. `Zugfolge`, Block-Z, Claim
und sonstige Herkunftshinweise dürfen nicht so verwendet werden, dass ein Fork
oder Dienst fälschlich als offiziell, unterstützt oder verbunden erscheint.
Die noch offene Eigentums- und Ähnlichkeitsprüfung ist in
[`TRADEMARKS.md`](../TRADEMARKS.md) und im
[`rights-register.yaml`](../compliance/rights-register.yaml) dokumentiert.

## Beiträge und künftiger CLA

Der Projekteigner hat einen Individual-/Entity-CLA als künftiges
Beitragsmodell gewählt. Diese Auswahl aktiviert noch keinen CLA. Externe
Beiträge bleiben geschlossen, bis:

- qualifizierte Beratung den tatsächlich verwendeten Text freigibt;
- Signaturberechtigung, Datenschutz, Aufbewahrung und Widerrufsbehandlung
  festgelegt sind;
- ein verpflichtender Repository-Check den passenden Datensatz erzwingt;
- AI-Unterstützung und Rechte an Drittmaterial nachvollziehbar offengelegt
  werden.

Es gibt derzeit weder eine DCO-Ausweichroute noch einen von einem Agenten
formulierten operativen CLA. Details stehen in
[`CONTRIBUTING.md`](../CONTRIBUTING.md).

## Drittanbieter und Release-Gate

Projektlizenzen relizenzieren keine Abhängigkeiten, Schriftarten,
Providerdaten oder fremden Medien. Der Browser-Build muss eine aus seiner
tatsächlichen Runtime-Closure erzeugte
`THIRD-PARTY-NOTICES`-Datei ausliefern. Container und andere Releasepakete
dürfen keine ungeprüften Build-Abhängigkeiten oder nativen Bibliotheken
mitführen. SBOM, Lizenzscan und Notice-Prüfung sind Release-Gates.

## Weiterhin offene Human-Gates

Der öffentliche Zustand heißt `LICENSED_REVIEW_PENDING`. Er bedeutet:

- die ausdrücklich zugeordneten Standard-Grants sind veröffentlicht;
- der dokumentierte Owner-Entscheid ist vorhanden;
- der verantwortliche rechtliche Lizenzgeber und die historische Rechtekette
  sind noch abschließend zu belegen;
- keine Quelle, Marke oder ungeprüfte Datei wird dadurch freigegeben;
- `MS-001` und die Produktionsfreigabe bleiben blockiert;
- externe Beiträge bleiben geschlossen.

Der maschinenlesbare Stand, Belege und nächste Schritte stehen im
[`compliance/rights-register.yaml`](../compliance/rights-register.yaml).
