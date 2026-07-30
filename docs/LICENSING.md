# Lizenzentscheidung für Zugfolge

**Status:** Entscheidungsvorlage, keine Rechtsberatung  
**Stand:** 30. Juli 2026  
**Entscheidung:** noch offen

## Kurzempfehlung

Wenn Zugfolge als echtes Open-Source-Projekt entwickelt werden soll, ist
**AGPL-3.0-or-later** für den selbst entwickelten Programmcode die passendste
Ausgangslage. Die AGPL wurde gerade für netzwerkbasierte Software entworfen:
Betreiber einer öffentlich zugänglichen, veränderten Fassung müssen den
interagierenden Nutzern den korrespondierenden Quellcode dieser Fassung
anbieten.

Das passt zu einem Browsergame mit großem Serveranteil besser als GPL oder MIT.
Die AGPL erlaubt weiterhin kommerzielle Nutzung, Bezahlabos, Hosting und
Support. Sie verhindert jedoch **nicht**, dass Dritte einen eigenen Zugfolge-Fork
hosten. Markenrechte, Community, Datenqualität und offizieller Betrieb bleiben
daher eigenständige Schutz- und Differenzierungsfaktoren.

Offizielle Grundlage:

- [GNU Affero General Public License 3.0](https://www.gnu.org/licenses/agpl-3.0.html)
- [GNU-Hinweise zur eindeutigen SPDX-Bezeichnung](https://www.gnu.org/licenses/identify-licenses-clearly.html)

## Empfohlenes Lizenzmosaik

| Bestandteil | Empfehlung | Begründung |
|---|---|---|
| eigener Programmcode | `AGPL-3.0-or-later` | Netzwerk-Copyleft für Web-, Game- und Simulationsserver |
| Block-Z, Wortmarke, Name, Logos | kein pauschaler Open-Content-Grant; separate Markennutzungsregeln | verhindert Verwechslung mit dem offiziellen Dienst |
| Projektdokumentation | optional `CC-BY-SA-4.0` | erlaubt Wiederverwendung mit Namensnennung und Share-alike |
| originale Test-Fixtures | AGPL oder `CC0-1.0`, je Herkunft | maschinenlesbar und unkompliziert; nur für selbst erzeugte Inhalte |
| OSM-abgeleitete Datenbank | `ODbL-1.0` plus Attribution | OSM-Daten stehen unter ODbL, nicht unter der Code-Lizenz |
| Drittanbieter-Feeds | jeweilige Lizenz/Vertrag | dürfen nicht pauschal unter die Projektlizenz gestellt werden |
| Soundtrack/Kosmetik/Illustrationen | separate Asset-Lizenz | kommerzielle Rechte und Contributor-Rechte sauber trennen |

Die Open Database License betrifft die Datenbank, nicht automatisch die
Software, die sie verarbeitet. OpenStreetMap verlangt Attribution und bei
öffentlich verbreiteten abgeleiteten Datenbanken grundsätzlich Share-alike.
Siehe [OpenStreetMap Copyright and License](https://www.openstreetmap.org/copyright)
und den vollständigen
[ODbL-1.0-Lizenztext](https://opendatacommons.org/licenses/odbl/1-0/).

## Alternativen

### Apache-2.0

Geeignet, wenn maximale Adoption, Integrationen und kommerzielle Forks wichtiger
sind als die Rückgabe von Serveränderungen. Die Lizenz ist permissiv und enthält
eine ausdrückliche Patentregelung. Ein Wettbewerber dürfte eine proprietär
veränderte Instanz betreiben, ohne seine Änderungen zu veröffentlichen.

### MIT

Sehr kurz und permissiv. Für Bibliotheken attraktiv, für den strategischen Kern
eines daten- und serverintensiven Spiels aber wahrscheinlich zu offen: Auch
proprietäre Hosting-Forks sind ohne Rückgabepflicht möglich.

### BSL 1.1

Eine Option, wenn der Quelltext sichtbar sein, ein konkurrierender
Produktionsbetrieb aber zunächst eingeschränkt werden soll. Die Business Source
License wird erst am definierten Change Date zu einer Open-Source-Lizenz. Bis
dahin ist sie **source-available, nicht Open Source**. Nutzungsgrenze,
Change-Date und Change-License müssen exakt formuliert werden. Das erschwert
Beiträge, Distributionen und manche Abhängigkeiten.

Offizielle Einführung:
[MariaDB Business Source License FAQ](https://mariadb.com/bsl-faq-adopting/).

### Proprietär

Am stärksten kontrollierbar, aber mit weniger externen Beiträgen, geringerer
Auditierbarkeit und weniger Vertrauen in ein KI-first-Projekt. Eine
spätere Öffnung bleibt möglich, sofern alle Contributor-Rechte zentral geklärt
sind.

## Entscheidungsfragen

Vor dem Hinzufügen einer `LICENSE`-Datei sollte der Projekteigner schriftlich
beantworten:

1. Darf ein Dritter einen öffentlichen, kommerziellen Zugfolge-Fork betreiben?
2. Reicht es, wenn dessen Änderungen wieder als Quellcode verfügbar werden?
3. Sollen externe Beiträge ohne Contributor License Agreement angenommen
   werden?
4. Ist späteres Dual Licensing geplant?
5. Welche juristische Person hält Urheber-, Marken- und Domainrechte?
6. Welche Assets sollen außerhalb der Code-Lizenz monetarisiert werden?

## Konkreter nächster Schritt

Wenn Frage 1 mit „ja, sofern Änderungen offen bleiben“ beantwortet wird:

1. vollständigen AGPL-3.0-Text als `LICENSE` hinzufügen;
2. `package.json` und alle Modul-Metadaten auf `AGPL-3.0-or-later` setzen;
3. im Web-UI einen sichtbaren Link „Quellcode“ und die rechtlichen Hinweise
   ergänzen;
4. `TRADEMARKS.md` und eine Asset-Lizenz finalisieren;
5. Contributor Certificate of Origin oder CLA festlegen;
6. Lizenzkompatibilität jeder Abhängigkeit automatisiert prüfen.

Bis dahin gilt: **keine stillschweigende Nutzungserlaubnis behaupten und keine
fremden Datensätze oder Assets ohne Quellenregister committen.**
