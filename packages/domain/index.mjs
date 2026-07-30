import { createHash } from "node:crypto";

/**
 * Half-open interval overlap: [startAt, endAt).
 */
export function intervalsOverlap(left, right) {
  return left.startAt < right.endAt && right.startAt < left.endAt;
}

export function findOccupationConflict(candidate, occupations) {
  return (
    occupations.find(
      (existing) =>
        existing.worldId === candidate.worldId &&
        existing.infrastructureReleaseId ===
          candidate.infrastructureReleaseId &&
        existing.resourceId === candidate.resourceId &&
        ["RESERVED", "ACTIVE"].includes(existing.status) &&
        intervalsOverlap(candidate, existing),
    ) ?? null
  );
}

/**
 * Applies an all-or-nothing reservation. Existing state is never mutated.
 */
export function reserveOccupationProfile(profile, occupations) {
  const staged = [];

  for (const candidate of profile) {
    const conflict = findOccupationConflict(candidate, [
      ...occupations,
      ...staged,
    ]);

    if (conflict) {
      return {
        accepted: false,
        reason: "CAPACITY_CONFLICT",
        conflict: {
          resourceId: conflict.resourceId,
          trainRunId: conflict.trainRunId,
          startAt: conflict.startAt,
          endAt: conflict.endAt,
        },
        occupations,
      };
    }

    staged.push({ ...candidate, status: "RESERVED" });
  }

  return {
    accepted: true,
    reason: null,
    conflict: null,
    occupations: [...occupations, ...staged],
  };
}

/**
 * Deterministic planning independent of submission and payment order.
 */
export function runPlanningWindow(requests, seed) {
  const stableRank = (request) =>
    createHash("sha256")
      .update(`${seed}:${request.pathRequestId}`)
      .digest("hex");

  return [...requests].sort((left, right) => {
    const priorityDelta = left.publicPriority - right.publicPriority;
    if (priorityDelta !== 0) return priorityDelta;
    return stableRank(left).localeCompare(stableRank(right));
  });
}

export function createLedgerEntry({
  entryId,
  worldId,
  currency,
  reference,
  postings,
}) {
  if (!Number.isInteger(postings.length) || postings.length < 2) {
    throw new Error("LEDGER_REQUIRES_TWO_POSTINGS");
  }

  const total = postings.reduce((sum, posting) => {
    if (!Number.isSafeInteger(posting.amountMinor)) {
      throw new Error("MONEY_MUST_USE_INTEGER_MINOR_UNITS");
    }
    return sum + BigInt(posting.amountMinor);
  }, 0n);

  if (total !== 0n) {
    throw new Error("LEDGER_NOT_BALANCED");
  }

  return Object.freeze({
    entryId,
    worldId,
    currency,
    reference,
    status: "POSTED",
    postings: Object.freeze(postings.map((posting) => Object.freeze(posting))),
  });
}

function canonicalize(value) {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalize).join(",")}]`;
  }

  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

export function replayStateHash(snapshot, orderedEvents) {
  let state = structuredClone(snapshot);

  for (const event of orderedEvents) {
    if (event.sequence !== state.worldSequence + 1) {
      throw new Error("WORLD_SEQUENCE_GAP");
    }
    state = {
      ...state,
      worldSequence: event.sequence,
      [event.aggregate]: structuredClone(event.data),
    };
  }

  return createHash("sha256").update(canonicalize(state)).digest("hex");
}
