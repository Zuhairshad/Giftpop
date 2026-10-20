import type { PaymentMode, Quote } from "@giftpop/contracts";

export type AmountRow = {
  label: string;
  minor: number;
  kind: "plain" | "discount" | "free" | "strong";
};

export type AmountsView = {
  currency: string;
  rows: AmountRow[];
  dueNow: { label: string; minor: number };
  /** Null when nothing is due on delivery. */
  dueOnDelivery: { label: string; minor: number } | null;
};

/**
 * The line under "Amount to pay now". `money` formats minor units; the numbers are the quote's.
 * Cash on delivery: the advance and what is left for the courier. Pay now: the full amount.
 */
export function dueNowNote(
  quote: Pick<Quote, "dueOnDeliveryMinor" | "discountMinor">,
  money: (minor: number) => string,
): string {
  if (quote.dueOnDeliveryMinor > 0) {
    return `This is the advance. You pay the other ${money(quote.dueOnDeliveryMinor)} when it is delivered.`;
  }
  return quote.discountMinor > 0
    ? `The full amount, with ${money(quote.discountMinor)} off for paying now.`
    : "The full amount.";
}

/** Arranges the API's quote for display. No arithmetic: every number comes from the quote. */
export function buildAmounts(quote: Quote, mode: PaymentMode): AmountsView {
  const rows: AmountRow[] = [{ label: "Gift", minor: quote.goodsMinor, kind: "plain" }];
  if (quote.discountMinor > 0) {
    rows.push({ label: "Pay-in-full discount", minor: quote.discountMinor, kind: "discount" });
  }
  rows.push({
    label: "Shipping",
    minor: quote.shippingMinor,
    kind: quote.shippingMinor === 0 ? "free" : "plain",
  });
  rows.push({ label: "Total", minor: quote.totalMinor, kind: "strong" });
  return {
    currency: quote.currency,
    rows,
    dueNow: {
      label: mode === "prepaid" ? "To pay now (full amount)" : "To pay now (advance)",
      minor: quote.dueNowMinor,
    },
    dueOnDelivery:
      quote.dueOnDeliveryMinor > 0
        ? { label: "To pay on delivery", minor: quote.dueOnDeliveryMinor }
        : null,
  };
}
