import type { PaymentMode, Quote } from "@giftpop/contracts";

/** One line of a price column. Amounts are the quote's integer minor units, formatted by the view. */
export type PriceRow =
  | { kind: "money"; label: string; minor: number }
  /** A saving shown as a minus amount. */
  | { kind: "discount"; label: string; minor: number }
  | { kind: "free"; label: string };

export interface PriceColumn {
  mode: PaymentMode;
  title: string;
  /** One plain sentence under the title. */
  summary: string;
  currency: string;
  rows: PriceRow[];
  /** The total, set apart under the rows. */
  total: { label: string; minor: number };
  /** What is paid now; for cash on delivery this is the advance. */
  dueNow: { label: string; minor: number };
  /** Only for cash on delivery. */
  dueOnDelivery: { label: string; minor: number } | null;
}

const TITLES: Record<PaymentMode, string> = { prepaid: "Pay now", cod: "Cash on delivery" };
const SUMMARIES: Record<PaymentMode, string> = {
  prepaid: "Pay the full amount now and get a discount on the gift.",
  cod: "Pay a small advance now and the rest when it arrives.",
};

function shippingRow(quote: Quote): PriceRow {
  return quote.shippingMinor === 0
    ? { kind: "free", label: "Shipping" }
    : { kind: "money", label: "Shipping", minor: quote.shippingMinor };
}

function toColumn(quote: Quote): PriceColumn {
  const rows: PriceRow[] = [{ kind: "money", label: "Gift", minor: quote.goodsMinor }];
  if (quote.discountMinor > 0) {
    rows.push({ kind: "discount", label: "Pay now discount", minor: quote.discountMinor });
  }
  rows.push(shippingRow(quote));

  const isCod = quote.mode === "cod";
  return {
    mode: quote.mode,
    title: TITLES[quote.mode],
    summary: SUMMARIES[quote.mode],
    currency: quote.currency,
    rows,
    total: { label: "Total", minor: quote.totalMinor },
    dueNow: { label: isCod ? "Advance due now" : "Due now", minor: quote.dueNowMinor },
    dueOnDelivery: isCod ? { label: "Due on delivery", minor: quote.dueOnDeliveryMinor } : null,
  };
}

/**
 * Turns the API quotes into the review columns, in the order the API sent them.
 * Shows only modes the quote contains and uses only numbers the quote gave: no price maths here.
 */
export function buildPriceColumns(quotes: readonly Quote[]): PriceColumn[] {
  const seen = new Set<PaymentMode>();
  const columns: PriceColumn[] = [];
  for (const quote of quotes) {
    if (seen.has(quote.mode)) continue;
    seen.add(quote.mode);
    columns.push(toColumn(quote));
  }
  return columns;
}
