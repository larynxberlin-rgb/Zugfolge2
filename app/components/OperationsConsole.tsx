"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import { BlockZ } from "./BlockZ";
import {
  MODE_DESCRIPTIONS,
  PILOT_STATIONS,
  PILOT_TRAINS,
  positionOnPath,
  type DisruptionMode,
  type PilotTrain,
  type TrafficType,
} from "../lib/pilot-data";

const NAVIGATION = [
  { id: "live", icon: "⌁", label: "Live-Lage", badge: "24" },
  { id: "paths", icon: "⑂", label: "Fahrplan & Trassen", badge: "3" },
  { id: "operations", icon: "◉", label: "Betriebszentrale", badge: "2" },
  { id: "markets", icon: "◇", label: "Märkte", badge: "7" },
  { id: "fleet", icon: "▰", label: "Fahrzeuge & Personal", badge: "" },
  { id: "company", icon: "▥", label: "Unternehmen", badge: "" },
] as const;

const ADMIN_NAVIGATION = [
  { id: "messages", icon: "▱", label: "Postfach", badge: "5" },
  { id: "world", icon: "⚙", label: "Weltinformationen", badge: "" },
] as const;

const WORKSPACE_LABELS: Record<string, string> = {
  live: "Live-Lage",
  paths: "Fahrplan & Trassen",
  operations: "Betriebszentrale",
  markets: "Märkte",
  fleet: "Fahrzeuge & Personal",
  company: "Unternehmen & Finanzen",
  messages: "Postfach",
  world: "Weltinformationen",
};

const TRACKS = [
  { left: 24, top: 26, width: 18.7, rotate: -15, fast: true },
  { left: 42, top: 21, width: 35.2, rotate: 45, fast: true },
  { left: 48, top: 42, width: 15.2, rotate: 158, fast: false },
  { left: 40, top: 55, width: 15.7, rotate: 34, fast: false },
  { left: 48, top: 65, width: 13.7, rotate: 25, fast: false },
  { left: 60, top: 74, width: 23.2, rotate: -5, fast: false },
  { left: 17, top: 35, width: 19.8, rotate: 37, fast: false },
] as const;

type TrainFilter = "ALL" | TrafficType;

function formatWorldTime(date: Date) {
  return new Intl.DateTimeFormat("de-DE", {
    timeZone: "Europe/Berlin",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

function formatWorldDate(date: Date) {
  return new Intl.DateTimeFormat("de-DE", {
    timeZone: "Europe/Berlin",
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function delayLabel(train: PilotTrain) {
  return train.delayMinutes > 0 ? `+${train.delayMinutes} min` : "pünktlich";
}

function trafficClass(type: TrafficType) {
  return `traffic-tag traffic-tag--${type.toLowerCase()}`;
}

function NavigationButton({
  item,
  active,
  onSelect,
}: {
  item: (typeof NAVIGATION)[number] | (typeof ADMIN_NAVIGATION)[number];
  active: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      type="button"
      className={`nav-button ${active ? "nav-button--active" : ""}`}
      onClick={() => onSelect(item.id)}
      aria-current={active ? "page" : undefined}
      title={item.label}
    >
      <span className="nav-button__icon" aria-hidden="true">
        {item.icon}
      </span>
      <span className="nav-button__label">{item.label}</span>
      {item.badge ? (
        <span
          className={`nav-button__badge ${
            item.id === "operations" ? "nav-button__badge--alert" : ""
          }`}
        >
          {item.badge}
        </span>
      ) : null}
    </button>
  );
}

function ModeSwitch({
  label,
  value,
  onChange,
}: {
  label: string;
  value: DisruptionMode;
  onChange: (mode: DisruptionMode) => void;
}) {
  return (
    <div className="mode-row">
      <span className="mode-row__label">{label}</span>
      <div className="mode-switch">
        {(["REALISTIC", "SIMULATED", "MANUAL"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            className={`mode-switch__button ${
              value === mode ? "mode-switch__button--active" : ""
            }`}
            onClick={() => onChange(mode)}
            aria-pressed={value === mode}
          >
            {mode === "REALISTIC"
              ? "Realistisch"
              : mode === "SIMULATED"
                ? "Simuliert"
                : "Manuell"}
          </button>
        ))}
      </div>
    </div>
  );
}

export function OperationsConsole() {
  const [now, setNow] = useState(
    () => new Date("2026-07-30T12:00:00.000Z"),
  );
  const [phase, setPhase] = useState(0);
  const [running, setRunning] = useState(true);
  const [activeWorkspace, setActiveWorkspace] = useState("live");
  const [selectedTrainId, setSelectedTrainId] = useState(PILOT_TRAINS[0].id);
  const [filter, setFilter] = useState<TrainFilter>("ALL");
  const [plannedWorksMode, setPlannedWorksMode] =
    useState<DisruptionMode>("SIMULATED");
  const [operationalIncidentMode, setOperationalIncidentMode] =
    useState<DisruptionMode>("SIMULATED");
  const [mapScale, setMapScale] = useState(1);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
      if (running) {
        setPhase((current) => current + 1);
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [running]);

  const selectedTrain =
    PILOT_TRAINS.find((train) => train.id === selectedTrainId) ??
    PILOT_TRAINS[0];

  const visibleTrains = useMemo(
    () =>
      filter === "ALL"
        ? PILOT_TRAINS
        : PILOT_TRAINS.filter((train) => train.type === filter),
    [filter],
  );

  return (
    <div className="console">
      <header className="topbar">
        <div className="brand" aria-label="Zugfolge">
          <BlockZ />
          <span className="brand__copy">
            <span className="brand__name">ZUGFOLGE</span>
            <span className="brand__claim">
              Plane präzise. Fahre profitabel.
            </span>
          </span>
        </div>

        <div className="topbar__center">
          <div className="world-label">
            <div className="eyebrow">Spielwelt</div>
            <div className="world-name">
              <span className="status-dot" aria-hidden="true" />
              Mitteldeutschland 2026
            </div>
          </div>
          <div className="world-clock" aria-label="Weltzeit">
            <span className="world-clock__time mono">
              {formatWorldTime(now)}
            </span>
            <span className="world-clock__date">{formatWorldDate(now)}</span>
          </div>
        </div>

        <div className="topbar__actions">
          <button className="icon-button" type="button" aria-label="Globale Suche">
            ⌕
          </button>
          <button
            className="icon-button"
            type="button"
            aria-label="5 ungelesene Meldungen"
          >
            ◌
          </button>
          <button className="profile-button" type="button">
            <span className="profile-button__avatar">NS</span>
            <span className="profile-button__copy">
              <span className="profile-button__name">Nordstern Rail</span>
              <span className="profile-button__role">Geschäftsführung</span>
            </span>
          </button>
        </div>
      </header>

      <aside className="sidebar" aria-label="Hauptnavigation">
        <div className="nav-section-label">Betrieb</div>
        <ul className="nav-list">
          {NAVIGATION.slice(0, 4).map((item) => (
            <li key={item.id}>
              <NavigationButton
                item={item}
                active={activeWorkspace === item.id}
                onSelect={setActiveWorkspace}
              />
            </li>
          ))}
        </ul>

        <div className="nav-section-label">Ressourcen</div>
        <ul className="nav-list">
          {NAVIGATION.slice(4).map((item) => (
            <li key={item.id}>
              <NavigationButton
                item={item}
                active={activeWorkspace === item.id}
                onSelect={setActiveWorkspace}
              />
            </li>
          ))}
        </ul>

        <div className="nav-section-label">System</div>
        <ul className="nav-list">
          {ADMIN_NAVIGATION.map((item) => (
            <li key={item.id}>
              <NavigationButton
                item={item}
                active={activeWorkspace === item.id}
                onSelect={setActiveWorkspace}
              />
            </li>
          ))}
        </ul>

        <section className="company-card" aria-label="Unternehmensliquidität">
          <div className="company-card__header">
            <h2 className="company-card__name">Nordstern Rail GmbH</h2>
            <span className="company-card__license">EVU aktiv</span>
          </div>
          <div className="company-card__balance mono">€ 12.486.320</div>
          <div className="company-card__delta">▲ 2,8 % diese Woche</div>
        </section>
      </aside>

      <main className="main">
        <div className="workspace">
          <header className="workspace-head">
            <div>
              <h1 className="workspace-title">
                {WORKSPACE_LABELS[activeWorkspace]}
              </h1>
              <p className="workspace-subtitle">
                Pilotnetz Leipzig–Halle–Erfurt · Datenstand 2026.07 · Qualität A/B
              </p>
            </div>
            <div className="workspace-actions">
              <span className="live-pill">
                <span className="live-pill__wave" aria-hidden="true" />
                Live · 24 Züge
              </span>
              <button
                className="simulation-button"
                type="button"
                onClick={() => setRunning((current) => !current)}
                aria-pressed={!running}
              >
                {running ? "Simulation pausieren" : "Simulation fortsetzen"}
              </button>
            </div>
          </header>

          <section className="rail-map" aria-label="Schematische Livemap des Pilotnetzes">
            <div className="map-meta">
              <span>Pilotnetz · eigene Vector-Tiles geplant</span>
              <span className="quality-badge">● A/B</span>
            </div>
            <div className="map-controls" aria-label="Kartenzoom">
              <button
                type="button"
                className="map-control"
                onClick={() => setMapScale((value) => Math.min(1.16, value + 0.08))}
                aria-label="Karte vergrößern"
              >
                +
              </button>
              <button
                type="button"
                className="map-control"
                onClick={() => setMapScale((value) => Math.max(0.9, value - 0.08))}
                aria-label="Karte verkleinern"
              >
                −
              </button>
            </div>

            <div className="network" style={{ transform: `scale(${mapScale})` }}>
              {TRACKS.map((track, index) => (
                <span
                  key={`${track.left}-${track.top}-${index}`}
                  className={`track ${track.fast ? "track--fast" : ""} ${
                    index === 4 && plannedWorksMode !== "MANUAL"
                      ? "track--blocked"
                      : ""
                  }`}
                  style={{
                    left: `${track.left}%`,
                    top: `${track.top}%`,
                    width: `${track.width}%`,
                    transform: `rotate(${track.rotate}deg)`,
                  }}
                  aria-hidden="true"
                />
              ))}

              {PILOT_STATIONS.map((station) => (
                <button
                  key={station.id}
                  type="button"
                  className={`station ${station.major ? "station--major" : ""}`}
                  style={{
                    left: `${station.point[0]}%`,
                    top: `${station.point[1]}%`,
                  }}
                  aria-label={`${station.name} auswählen`}
                >
                  <span className="station__node" />
                  <span className="station__label">{station.shortName}</span>
                </button>
              ))}

              {visibleTrains.map((train) => {
                const position = positionOnPath(
                  train.path,
                  train.progress + phase * train.phaseRate,
                );
                return (
                  <button
                    key={train.id}
                    type="button"
                    className={`train-marker ${
                      selectedTrainId === train.id
                        ? "train-marker--selected"
                        : ""
                    }`}
                    style={
                      {
                        left: `${position[0]}%`,
                        top: `${position[1]}%`,
                        "--train-color": train.color,
                      } as CSSProperties
                    }
                    onClick={() => setSelectedTrainId(train.id)}
                    aria-label={`${train.number}, ${train.route}, ${delayLabel(train)}`}
                  >
                    <span className="train-marker__dot" />
                    <span className="train-marker__label mono">
                      {train.number}
                    </span>
                  </button>
                );
              })}

              {operationalIncidentMode !== "MANUAL" ? (
                <span
                  className="incident-marker"
                  style={{ left: "55%", top: "69%" }}
                  role="img"
                  aria-label="Geschwindigkeitsbeschränkung bei Naumburg"
                />
              ) : null}
            </div>

            <div className="map-legend" aria-label="Kartenlegende">
              <span className="legend-item" style={{ color: "#39C6E5" }}>
                <span className="legend-dot" /> SPFV
              </span>
              <span className="legend-item" style={{ color: "#45D39A" }}>
                <span className="legend-dot" /> SPNV
              </span>
              <span className="legend-item" style={{ color: "#8B7CFF" }}>
                <span className="legend-dot" /> SGV
              </span>
              <span className="legend-item" style={{ color: "#FFB84D" }}>
                <span className="legend-dot" /> Restriktion
              </span>
            </div>
            <a
              className="map-attribution"
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noreferrer"
            >
              Ziel-Datengrundlage: OpenStreetMap (ODbL) · Demo schematisch
            </a>
          </section>

          <section className="operations-strip" aria-label="Laufender Betrieb">
            <div className="train-board">
              <header className="panel-head">
                <h2 className="panel-title">Aktive Zugläufe</h2>
                <div className="filter-list" aria-label="Zugarten filtern">
                  {(["ALL", "SPFV", "SPNV", "SGV"] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={`filter-button ${
                        filter === value ? "filter-button--active" : ""
                      }`}
                      onClick={() => setFilter(value)}
                      aria-pressed={filter === value}
                    >
                      {value === "ALL" ? "Alle" : value}
                    </button>
                  ))}
                </div>
              </header>
              <table className="train-table">
                <thead>
                  <tr>
                    <th>Zug</th>
                    <th>Art</th>
                    <th>Relation</th>
                    <th>Status</th>
                    <th>Nächster Punkt</th>
                    <th>v</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleTrains.map((train) => (
                    <tr
                      key={train.id}
                      aria-selected={selectedTrainId === train.id}
                    >
                      <td className="train-number mono">
                        <button
                          type="button"
                          className="train-select"
                          onClick={() => setSelectedTrainId(train.id)}
                          aria-label={`${train.number} auswählen`}
                        >
                          {train.number}
                        </button>
                      </td>
                      <td>
                        <span className={trafficClass(train.type)}>
                          {train.type}
                        </span>
                      </td>
                      <td>{train.route}</td>
                      <td>
                        <span
                          className={`status-tag ${
                            train.delayMinutes > 0 ? "status-tag--delay" : ""
                          }`}
                        >
                          {train.delayMinutes > 0 ? "▲" : "●"} {delayLabel(train)}
                        </span>
                      </td>
                      <td>{train.nextStop}</td>
                      <td className="mono">{train.speedKph} km/h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <section className="disruption-quick">
              <header className="panel-head">
                <h2 className="panel-title">Weltregel · Störungen</h2>
              </header>
              <div className="disruption-quick__body">
                <ModeSwitch
                  label="Baustellen"
                  value={plannedWorksMode}
                  onChange={setPlannedWorksMode}
                />
                <ModeSwitch
                  label="Betriebsstörungen"
                  value={operationalIncidentMode}
                  onChange={setOperationalIncidentMode}
                />
                <p className="mode-description">
                  Baustellen: {MODE_DESCRIPTIONS[plannedWorksMode]}
                </p>
                <p className="mode-description">
                  Betriebsstörungen:{" "}
                  {MODE_DESCRIPTIONS[operationalIncidentMode]}
                </p>
              </div>
            </section>
          </section>
        </div>
      </main>

      <aside className="inspector" aria-label="Zugdetails">
        <header className="inspector__head">
          <div className="inspector__title-row">
            <div>
              <div className="eyebrow">{selectedTrain.operator}</div>
              <h2 className="inspector__train-number mono">
                {selectedTrain.number}
              </h2>
              <p className="inspector__route">{selectedTrain.route}</p>
            </div>
            <span className="punctuality">{delayLabel(selectedTrain)}</span>
          </div>
        </header>

        <div className="inspector__body">
          <section className="inspector-section">
            <h3 className="inspector-section__title">Live-Zustand</h3>
            <div className="metric-grid">
              <div className="metric">
                <span className="metric__label">Geschwindigkeit</span>
                <strong className="metric__value mono">
                  {selectedTrain.speedKph} km/h
                </strong>
              </div>
              <div className="metric">
                <span className="metric__label">Nächste Ankunft</span>
                <strong className="metric__value mono">
                  {selectedTrain.eta}
                </strong>
              </div>
              <div className="metric">
                <span className="metric__label">Formation</span>
                <strong className="metric__value" style={{ fontSize: "9px" }}>
                  {selectedTrain.formation}
                </strong>
              </div>
              <div className="metric">
                <span className="metric__label">Zielgleis</span>
                <strong className="metric__value mono">
                  {selectedTrain.platform}
                </strong>
              </div>
            </div>
          </section>

          <section className="inspector-section">
            <h3 className="inspector-section__title">Laufweg</h3>
            <div className="route-progress">
              <div className="route-stop route-stop--done">
                <span className="route-stop__name">{selectedTrain.origin}</span>
                <span className="route-stop__time mono">ab 14:21 · pünktlich</span>
              </div>
              <div className="route-stop route-stop--active">
                <span className="route-stop__name">{selectedTrain.nextStop}</span>
                <span className="route-stop__time mono">
                  an {selectedTrain.eta} · Prognose
                </span>
              </div>
              <div className="route-stop">
                <span className="route-stop__name">
                  {selectedTrain.destination}
                </span>
                <span className="route-stop__time mono">planmäßig 15:03</span>
              </div>
            </div>
          </section>

          <section className="inspector-section">
            <h3 className="inspector-section__title">Ressourcenbelegung</h3>
            <div className="occupation-list">
              <div className="occupation">
                <span className="mono">B-17</span>
                <span className="occupation__bar">
                  <span className="occupation__fill" style={{ width: "100%" }} />
                </span>
                <span className="occupation__state">geräumt</span>
              </div>
              <div className="occupation">
                <span className="mono">{selectedTrain.block.split(" · ")[1]}</span>
                <span className="occupation__bar">
                  <span className="occupation__fill" style={{ width: "66%" }} />
                </span>
                <span style={{ color: "#39C6E5" }}>belegt</span>
              </div>
              <div className="occupation">
                <span className="mono">B-19</span>
                <span className="occupation__bar">
                  <span className="occupation__fill" style={{ width: "18%" }} />
                </span>
                <span style={{ color: "#8FA2B1" }}>reserviert</span>
              </div>
            </div>
          </section>

          <section className="inspector-section">
            <h3 className="inspector-section__title">Planner-Entscheidung</h3>
            <div className="decision-card">
              <div className="decision-card__title">
                <span aria-hidden="true">✓</span> Trasse konfliktfrei
              </div>
              <p className="decision-card__copy">
                Belegung wurde gegen Block-, Fahrstraßen-, Bahnsteig- und
                Gegenfahrressourcen geprüft. Zahlungsstatus war kein
                Eingangsparameter.
              </p>
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
}
