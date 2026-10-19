import type { DashboardSummary } from "@giftpop/contracts";

import { formatMoney } from "@/lib/format";

export interface TileModel {
  key: keyof DashboardSummary["needsAction"];
  label: string;
  count: number;
  href: string;
  /** Calm text shown instead of the number's urgency when the count is zero. */
  zeroText: string;
}

const TILE_DEFS: ReadonlyArray<Omit<TileModel, "count">> = [
  {
    key: "awaitingPaymentWithProof",
    label: "Payment proofs to check",
    href: "/orders?status=awaiting_payment&hasPendingProof=true",
    zeroText: "Nothing waiting",
  },
  {
    key: "toMake",
    label: "Orders to make",
    href: "/orders?status=confirmed",
    zeroText: "Nothing waiting",
  },
  {
    key: "toShip",
    label: "Orders to ship",
    href: "/orders?status=packed",
    zeroText: "Nothing waiting",
  },
  {
    key: "deliveryFailed",
    label: "Failed deliveries",
    href: "/orders?status=delivery_failed",
    zeroText: "Nothing waiting",
  },
];

export function buildTiles(needsAction: DashboardSummary["needsAction"]): TileModel[] {
  return TILE_DEFS.map((def) => ({ ...def, count: needsAction[def.key] }));
}

/** The accessible name of a tile link: the count and the label in one phrase. */
export function tileAccessibleName(tile: Pick<TileModel, "count" | "label">): string {
  return `${tile.count} ${tile.label.toLowerCase()}`;
}

export interface RevenueLine {
  currency: string;
  text: string;
}

/** One line per currency, sorted by currency code. Amounts are never added across currencies. */
export function revenueLines(revenue: DashboardSummary["today"]["revenue"]): RevenueLine[] {
  const byCurrency = new Map<string, number>();
  for (const row of revenue) {
    byCurrency.set(row.currency, (byCurrency.get(row.currency) ?? 0) + row.amountMinor);
  }
  return [...byCurrency.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([currency, amountMinor]) => ({ currency, text: formatMoney(amountMinor, currency) }));
}

export function ordersLabel(count: number): string {
  return count === 1 ? "1 order" : `${count} orders`;
}
