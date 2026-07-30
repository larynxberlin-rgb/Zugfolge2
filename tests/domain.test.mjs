import assert from "node:assert/strict";
import test from "node:test";

import {
  createLedgerEntry,
  intervalsOverlap,
  replayStateHash,
  reserveOccupationProfile,
  runPlanningWindow,
} from "../packages/domain/index.mjs";

const baseOccupation = {
  worldId: "world-1",
  infrastructureReleaseId: "infra-2026-1",
  resourceId: "block-lleu-001",
  trainRunId: "train-a",
  startAt: 100,
  endAt: 200,
  status: "RESERVED",
};

test("uses half-open occupation intervals", () => {
  assert.equal(
    intervalsOverlap(baseOccupation, { startAt: 200, endAt: 250 }),
    false,
  );
  assert.equal(
    intervalsOverlap(baseOccupation, { startAt: 199, endAt: 250 }),
    true,
  );
});

test("rejects the complete profile without partial reservations", () => {
  const existing = [baseOccupation];
  const profile = [
    {
      ...baseOccupation,
      resourceId: "block-free",
      trainRunId: "train-b",
      startAt: 20,
      endAt: 40,
    },
    {
      ...baseOccupation,
      trainRunId: "train-b",
      startAt: 150,
      endAt: 250,
    },
  ];

  const result = reserveOccupationProfile(profile, existing);
  assert.equal(result.accepted, false);
  assert.equal(result.reason, "CAPACITY_CONFLICT");
  assert.equal(result.occupations, existing);
  assert.deepEqual(result.occupations, [baseOccupation]);
});

test("allocates adjacent blocks safely", () => {
  const profile = [
    { ...baseOccupation, trainRunId: "train-b", startAt: 200, endAt: 250 },
    {
      ...baseOccupation,
      resourceId: "block-lleu-002",
      trainRunId: "train-b",
      startAt: 240,
      endAt: 300,
    },
  ];
  const result = reserveOccupationProfile(profile, [baseOccupation]);
  assert.equal(result.accepted, true);
  assert.equal(result.occupations.length, 3);
});

test("planning order is deterministic and has no payment tier", () => {
  const requests = [
    { pathRequestId: "b", publicPriority: 1 },
    { pathRequestId: "a", publicPriority: 1 },
    { pathRequestId: "urgent", publicPriority: 0 },
  ];

  const first = runPlanningWindow(requests, "period-2026-12");
  const second = runPlanningWindow([...requests].reverse(), "period-2026-12");
  assert.deepEqual(first, second);
  assert.equal(first[0].pathRequestId, "urgent");
  assert.equal(
    JSON.stringify(first).includes("payment"),
    false,
  );
});

test("ledger accepts only balanced integer-minor postings", () => {
  const entry = createLedgerEntry({
    entryId: "entry-1",
    worldId: "world-1",
    currency: "EUR",
    reference: "path-allocation-1",
    postings: [
      { account: "PATH_EXPENSE", amountMinor: 12_500 },
      { account: "CASH", amountMinor: -12_500 },
    ],
  });
  assert.equal(entry.status, "POSTED");
  assert.equal(Object.isFrozen(entry), true);

  assert.throws(
    () =>
      createLedgerEntry({
        entryId: "entry-2",
        worldId: "world-1",
        currency: "EUR",
        reference: "bad",
        postings: [
          { account: "PATH_EXPENSE", amountMinor: 100 },
          { account: "CASH", amountMinor: -99 },
        ],
      }),
    /LEDGER_NOT_BALANCED/,
  );

  assert.throws(
    () =>
      createLedgerEntry({
        entryId: "entry-3",
        worldId: "world-1",
        currency: "EUR",
        reference: "unsafe-integer",
        postings: [
          { account: "PATH_EXPENSE", amountMinor: 2 ** 53 },
          { account: "ROUNDING", amountMinor: 1 },
          { account: "CASH", amountMinor: -(2 ** 53) },
        ],
      }),
    /MONEY_MUST_USE_INTEGER_MINOR_UNITS/,
  );
});

test("replay is deterministic and rejects sequence gaps", () => {
  const snapshot = {
    worldId: "world-1",
    worldSequence: 4,
    train: { status: "ALLOCATED" },
  };
  const events = [
    {
      sequence: 5,
      aggregate: "train",
      data: { status: "RUNNING", resource: "block-1" },
    },
    {
      sequence: 6,
      aggregate: "train",
      data: { status: "RUNNING", resource: "block-2" },
    },
  ];

  assert.equal(
    replayStateHash(snapshot, events),
    replayStateHash(structuredClone(snapshot), structuredClone(events)),
  );
  assert.throws(
    () => replayStateHash(snapshot, [{ ...events[0], sequence: 6 }]),
    /WORLD_SEQUENCE_GAP/,
  );
});
