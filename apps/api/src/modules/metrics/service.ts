import { ORDER_STATUSES, type MetricsResponse, type OrderStatus } from "@giftpop/contracts";

import { isDbReady } from "../../db";
import { OutboxModel } from "../notifications/model";
import { OrderModel } from "../orders/model";

import { APP_VERSION } from "./version";

const MINUTE_MS = 60_000;
const DAY_MS = 86_400_000;

/** Index key patterns the queries are written for; passed as `hint` and checked by tests. */
export const METRICS_HINTS = {
  ordersByStatus: { status: 1, createdAt: -1 },
  ordersByCreatedAt: { createdAt: -1 },
  outboxByStatus: { status: 1, nextAttemptAt: 1 },
} as const;

function ageMinutes(from: Date | undefined, now: Date): number | null {
  if (!from) return null;
  return Math.max(0, Math.floor((now.getTime() - from.getTime()) / MINUTE_MS));
}

async function oldestOrderCreatedAt(status: OrderStatus): Promise<Date | undefined> {
  const doc = await OrderModel.findOne({ status })
    .sort({ createdAt: 1 })
    .select({ createdAt: 1 })
    .hint(METRICS_HINTS.ordersByStatus)
    .lean();
  return doc?.createdAt;
}

async function oldestPendingDueAt(): Promise<Date | undefined> {
  const doc = await OutboxModel.findOne({ status: "pending" })
    .sort({ nextAttemptAt: 1 })
    .select({ nextAttemptAt: 1 })
    .hint(METRICS_HINTS.outboxByStatus)
    .lean();
  return doc?.nextAttemptAt;
}

/**
 * Cheap enough to poll every minute: one covered index scan for the status counts, two
 * counts on indexed ranges, and four single-document index reads. Nothing reads order bodies.
 */
export async function getMetrics(now: Date = new Date()): Promise<MetricsResponse> {
  const since24h = new Date(now.getTime() - DAY_MS);
  const since7d = new Date(now.getTime() - 7 * DAY_MS);

  const [
    statusRows,
    last24h,
    last7d,
    oldestAwaiting,
    oldestConfirmed,
    pending,
    failed,
    oldestPending,
  ] = await Promise.all([
    OrderModel.aggregate<{ _id: OrderStatus; count: number }>(
      [{ $group: { _id: "$status", count: { $sum: 1 } } }],
      { hint: METRICS_HINTS.ordersByStatus },
    ),
    OrderModel.countDocuments({ createdAt: { $gte: since24h } }).hint(
      METRICS_HINTS.ordersByCreatedAt,
    ),
    OrderModel.countDocuments({ createdAt: { $gte: since7d } }).hint(
      METRICS_HINTS.ordersByCreatedAt,
    ),
    oldestOrderCreatedAt("awaiting_payment"),
    oldestOrderCreatedAt("confirmed"),
    OutboxModel.countDocuments({ status: "pending" }).hint(METRICS_HINTS.outboxByStatus),
    OutboxModel.countDocuments({ status: "failed" }).hint(METRICS_HINTS.outboxByStatus),
    oldestPendingDueAt(),
  ]);

  const byStatus = Object.fromEntries(ORDER_STATUSES.map((status) => [status, 0])) as Record<
    OrderStatus,
    number
  >;
  for (const row of statusRows) {
    if (row._id in byStatus) byStatus[row._id] = row.count;
  }

  return {
    generatedAt: now.toISOString(),
    orders: {
      byStatus,
      createdLast24h: last24h,
      createdLast7d: last7d,
      oldestAwaitingPaymentAgeMinutes: ageMinutes(oldestAwaiting, now),
      oldestConfirmedAgeMinutes: ageMinutes(oldestConfirmed, now),
    },
    outbox: {
      pending,
      failed,
      oldestPendingAgeMinutes: ageMinutes(oldestPending, now),
    },
    process: {
      uptimeSeconds: Math.floor(process.uptime()),
      mongoReady: isDbReady(),
      version: APP_VERSION,
    },
  };
}
