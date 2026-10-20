import type { ColourOption, QuoteResponse } from "@giftpop/contracts";

import { formatMoney } from "@/lib/format-money";

/** "Bouquet, 8 items": the packaging's own name from the catalog and how many items are in it. */
export function overviewCaption(packagingName: string, itemCount: number): string {
  if (itemCount === 0) return `${packagingName}, no items yet`;
  return `${packagingName}, ${itemCount} ${itemCount === 1 ? "item" : "items"}`;
}

/** The palette name of a colour ("Kraft"), or the hex code when the palette has no such colour. */
export function colourName(options: readonly ColourOption[], hex: string | null): string {
  if (hex === null) return "none";
  return options.find((option) => option.hex.toLowerCase() === hex.toLowerCase())?.name ?? hex;
}

/** Under the pill's amount: it is the goods subtotal, so it differs from both review totals. */
export const PRICE_PILL_NOTE = "before shipping and discounts";

export type PriceView = { kind: "amount"; text: string } | { kind: "pending" } | { kind: "error" };

/**
 * What the price pill shows. The amount is the gift's price from the API quote ("goods", before any
 * discount and shipping) and is never worked out here. While a new quote loads, the old one stays.
 */
export function priceView(
  quote: QuoteResponse | null,
  status: "idle" | "loading" | "ready" | "error",
): PriceView {
  const first = quote?.quotes[0];
  if (first) return { kind: "amount", text: formatMoney(first.goodsMinor, first.currency, "en") };
  return status === "error" ? { kind: "error" } : { kind: "pending" };
}
