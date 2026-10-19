import type { DashboardSummary } from "@giftpop/contracts";

import { OrderModel } from "../orders/model";

import {
  awaitingProofQuery,
  ordersByCountryQuery,
  ordersTodayQuery,
  revenueTodayQuery,
  statusCountsQuery,
  type DashboardQuery,
} from "./queries";

async function run<T extends object>(query: DashboardQuery): Promise<T[]> {
  return OrderModel.collection.aggregate<T>(query.pipeline, { hint: query.hint }).toArray();
}

export async function getDashboardSummary(now: Date): Promise<DashboardSummary> {
  const [statusRows, proofRows, todayRows, revenueRows, countryRows] = await Promise.all([
    run<{ _id: string; count: number }>(statusCountsQuery()),
    run<{ count: number }>(awaitingProofQuery()),
    run<{ count: number }>(ordersTodayQuery(now)),
    run<{ _id: string; amountMinor: number }>(revenueTodayQuery(now)),
    run<{ _id: string; orders: number }>(ordersByCountryQuery(now)),
  ]);
  const byStatus = (status: string): number =>
    statusRows.find((row) => row._id === status)?.count ?? 0;

  return {
    needsAction: {
      awaitingPaymentWithProof: proofRows[0]?.count ?? 0,
      toMake: byStatus("confirmed"),
      toShip: byStatus("packed"),
      deliveryFailed: byStatus("delivery_failed"),
    },
    today: {
      orders: todayRows[0]?.count ?? 0,
      revenue: revenueRows.map((row) => ({ currency: row._id, amountMinor: row.amountMinor })),
    },
    ordersByCountry: countryRows.map((row) => ({ country: row._id, orders: row.orders })),
  };
}
