type Document = Record<string, unknown>;

/** An aggregation pipeline plus the index it is written for. */
export interface DashboardQuery {
  pipeline: Document[];
  /** Index key pattern; passed as `hint` so the plan is stable even on tiny collections. */
  hint: Record<string, 1 | -1>;
}

const DAY_MS = 86_400_000;
const WINDOW_DAYS = 30;

/** Start of the UTC day containing `now`. */
export function utcDayStart(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function utcDayRange(now: Date): { $gte: Date; $lt: Date } {
  const start = utcDayStart(now);
  return { $gte: start, $lt: new Date(start.getTime() + DAY_MS) };
}

/** Counts per status for the three plain buckets. */
export function statusCountsQuery(): DashboardQuery {
  return {
    pipeline: [
      { $match: { status: { $in: ["confirmed", "packed", "delivery_failed"] } } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ],
    hint: { status: 1, createdAt: -1 },
  };
}

/** Awaiting-payment orders with at least one proof that is still pending review. */
export function awaitingProofQuery(): DashboardQuery {
  return {
    pipeline: [
      { $match: { status: "awaiting_payment", "proofs.status": "pending" } },
      { $count: "count" },
    ],
    hint: { status: 1, "proofs.status": 1 },
  };
}

/** Orders created on the UTC day of `now`. */
export function ordersTodayQuery(now: Date): DashboardQuery {
  return {
    pipeline: [{ $match: { createdAt: utcDayRange(now) } }, { $count: "count" }],
    hint: { createdAt: -1 },
  };
}

/** Money received on the UTC day of `now`, one row per currency, refunds excluded. */
export function revenueTodayQuery(now: Date): DashboardQuery {
  const range = utcDayRange(now);
  return {
    pipeline: [
      { $match: { "payments.recordedAt": range } },
      { $unwind: "$payments" },
      {
        $match: {
          "payments.recordedAt": range,
          "payments.kind": { $in: ["advance", "full", "balance"] },
        },
      },
      {
        $group: {
          _id: "$payments.amount.currency",
          amountMinor: { $sum: "$payments.amount.amountMinor" },
        },
      },
      { $sort: { _id: 1 } },
    ],
    hint: { "payments.recordedAt": 1 },
  };
}

/** Orders per country created in the 30 days up to `now` (any status). */
export function ordersByCountryQuery(now: Date): DashboardQuery {
  const from = new Date(now.getTime() - WINDOW_DAYS * DAY_MS);
  return {
    pipeline: [
      { $match: { createdAt: { $gte: from, $lte: now } } },
      { $group: { _id: "$country", orders: { $sum: 1 } } },
      { $sort: { orders: -1, _id: 1 } },
    ],
    hint: { createdAt: -1, country: 1 },
  };
}
