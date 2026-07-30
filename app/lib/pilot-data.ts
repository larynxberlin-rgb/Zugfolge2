export type TrafficType = "SPFV" | "SPNV" | "SGV";
export type TrainStatus = "ON_TIME" | "DELAYED";
export type DisruptionMode = "REALISTIC" | "SIMULATED" | "MANUAL";

export type Point = readonly [x: number, y: number];

export interface PilotTrain {
  id: string;
  number: string;
  operator: string;
  type: TrafficType;
  route: string;
  origin: string;
  destination: string;
  status: TrainStatus;
  delayMinutes: number;
  speedKph: number;
  nextStop: string;
  eta: string;
  platform: string;
  formation: string;
  block: string;
  progress: number;
  phaseRate: number;
  color: string;
  path: readonly Point[];
}

export interface Station {
  id: string;
  name: string;
  shortName: string;
  major: boolean;
  point: Point;
}

export const PILOT_TRAINS: readonly PilotTrain[] = [
  {
    id: "tr-ice-1008",
    number: "ICE 1008",
    operator: "Nordstern Fernverkehr",
    type: "SPFV",
    route: "Leipzig Hbf → Erfurt Hbf",
    origin: "Leipzig Hbf",
    destination: "Erfurt Hbf",
    status: "ON_TIME",
    delayMinutes: 0,
    speedKph: 248,
    nextStop: "Erfurt Hbf",
    eta: "14:57",
    platform: "2",
    formation: "BR 412 · 7-teilig",
    block: "SFS 5919 · B-18",
    progress: 0.58,
    phaseRate: 0.006,
    color: "#39C6E5",
    path: [
      [24, 26],
      [42, 21],
      [63, 48],
      [83, 72],
    ],
  },
  {
    id: "tr-re-1619",
    number: "RE 16",
    operator: "Saale-Elster Mobil",
    type: "SPNV",
    route: "Halle Hbf → Erfurt Hbf",
    origin: "Halle Hbf",
    destination: "Erfurt Hbf",
    status: "DELAYED",
    delayMinutes: 3,
    speedKph: 118,
    nextStop: "Weißenfels",
    eta: "14:42",
    platform: "3",
    formation: "BR 442 · Doppeltraktion",
    block: "Strecke 6340 · B-07",
    progress: 0.31,
    phaseRate: 0.004,
    color: "#45D39A",
    path: [
      [48, 42],
      [40, 55],
      [48, 65],
      [60, 74],
      [83, 72],
    ],
  },
  {
    id: "tr-dgs-43121",
    number: "DGS 43121",
    operator: "ElbeCargo",
    type: "SGV",
    route: "Leipzig-Wahren → Erfurt Gbf",
    origin: "Leipzig-Wahren",
    destination: "Erfurt Gbf",
    status: "ON_TIME",
    delayMinutes: 0,
    speedKph: 92,
    nextStop: "Naumburg (Saale)",
    eta: "15:16",
    platform: "G 14",
    formation: "BR 187 · 612 m · 1.584 t",
    block: "Strecke 6367 · G-22",
    progress: 0.48,
    phaseRate: 0.003,
    color: "#8B7CFF",
    path: [
      [17, 35],
      [33, 48],
      [48, 65],
      [60, 74],
      [83, 72],
    ],
  },
  {
    id: "tr-s5x-37542",
    number: "S 5X",
    operator: "Mitteldeutsche S-Bahn",
    type: "SPNV",
    route: "Leipzig Hbf → Halle Hbf",
    origin: "Leipzig Hbf",
    destination: "Halle Hbf",
    status: "DELAYED",
    delayMinutes: 6,
    speedKph: 74,
    nextStop: "Flughafen Leipzig/Halle",
    eta: "14:39",
    platform: "1",
    formation: "BR 1442 · 3-teilig",
    block: "Strecke 5919 · B-05",
    progress: 0.62,
    phaseRate: 0.0045,
    color: "#FFB84D",
    path: [
      [24, 26],
      [42, 21],
      [48, 42],
    ],
  },
];

export const PILOT_STATIONS: readonly Station[] = [
  {
    id: "leipzig-hbf",
    name: "Leipzig Hbf",
    shortName: "Leipzig Hbf",
    major: true,
    point: [24, 26],
  },
  {
    id: "leipzig-wahren",
    name: "Leipzig-Wahren",
    shortName: "L-Wahren",
    major: false,
    point: [17, 35],
  },
  {
    id: "leipzig-airport",
    name: "Flughafen Leipzig/Halle",
    shortName: "Flughafen",
    major: false,
    point: [42, 21],
  },
  {
    id: "halle-hbf",
    name: "Halle (Saale) Hbf",
    shortName: "Halle Hbf",
    major: true,
    point: [48, 42],
  },
  {
    id: "merseburg",
    name: "Merseburg",
    shortName: "Merseburg",
    major: false,
    point: [40, 55],
  },
  {
    id: "weissenfels",
    name: "Weißenfels",
    shortName: "Weißenfels",
    major: false,
    point: [48, 65],
  },
  {
    id: "naumburg",
    name: "Naumburg (Saale) Hbf",
    shortName: "Naumburg",
    major: false,
    point: [60, 74],
  },
  {
    id: "erfurt-hbf",
    name: "Erfurt Hbf",
    shortName: "Erfurt Hbf",
    major: true,
    point: [83, 72],
  },
];

export const MODE_DESCRIPTIONS: Record<DisruptionMode, string> = {
  REALISTIC:
    "Autorisierte Echtquellen werden mit Provenienz eingespielt. Für diese Pilotwelt ist noch kein Feed freigegeben.",
  SIMULATED:
    "Deterministische Ereignisse, kalibriert auf das Pilotjahr 2026. Gleicher Seed erzeugt denselben Verlauf.",
  MANUAL:
    "Keine automatischen Ereignisse. Baustellen und Störungen werden ausschließlich durch die Spielleitung angelegt.",
};

export function positionOnPath(
  path: readonly Point[],
  progress: number,
): Point {
  if (path.length < 2) {
    return path[0] ?? [50, 50];
  }

  const normalized = ((progress % 1) + 1) % 1;
  const scaled = normalized * (path.length - 1);
  const index = Math.min(Math.floor(scaled), path.length - 2);
  const local = scaled - index;
  const start = path[index];
  const end = path[index + 1];

  return [
    start[0] + (end[0] - start[0]) * local,
    start[1] + (end[1] - start[1]) * local,
  ];
}
