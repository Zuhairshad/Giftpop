import { PAYMENT_POLICY } from "@giftpop/contracts";
import type { PaymentMode, Quote } from "@giftpop/contracts";

export type CardRow =
  | { kind: "money"; label: string; minor: number }
  | { kind: "discount"; label: string; minor: number }
  | { kind: "free"; label: string };

export interface PaymentCard {
  mode: PaymentMode;
  title: string;
  summary: string;
  currency: string;
  rows: CardRow[];
  total: { label: string; minor: number };
  /** What is paid now: the full total for "Pay now", the advance for cash on delivery. */
  dueNow: { label: string; minor: number };
  /** Only for cash on delivery. */
  dueOnDelivery: { label: string; minor: number } | null;
}

const TITLES: Record<PaymentMode, string> = { prepaid: "Pay now", cod: "Cash on delivery" };
const SUMMARIES: Record<PaymentMode, string> = {
  prepaid: "Pay the full amount now by bank transfer and get a discount on the gift.",
  cod: `Pay ${PAYMENT_POLICY.cod.advancePercent}% now and the rest when your gift arrives.`,
};

function toCard(quote: Quote): PaymentCard {
  const rows: CardRow[] = [{ kind: "money", label: "Gift", minor: quote.goodsMinor }];
  if (quote.discountMinor > 0) {
    rows.push({ kind: "discount", label: "Pay now discount", minor: quote.discountMinor });
  }
  rows.push(
    quote.shippingMinor === 0
      ? { kind: "free", label: "Shipping" }
      : { kind: "money", label: "Shipping", minor: quote.shippingMinor },
  );
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
 * One card per quote whose mode the country allows, in the order the API sent them.
 * Every amount is a number from the quote: nothing is computed here.
 */
export function buildPaymentCards(
  quotes: readonly Quote[],
  allowedModes: readonly PaymentMode[],
): PaymentCard[] {
  const seen = new Set<PaymentMode>();
  const cards: PaymentCard[] = [];
  for (const quote of quotes) {
    if (!allowedModes.includes(quote.mode) || seen.has(quote.mode)) continue;
    seen.add(quote.mode);
    cards.push(toCard(quote));
  }
  return cards;
}

/** Keeps the customer's pick while it is still offered, otherwise falls back to the first card. */
export function resolveSelectedMode(
  cards: readonly PaymentCard[],
  picked: PaymentMode | null,
): PaymentMode | null {
  if (picked !== null && cards.some((card) => card.mode === picked)) return picked;
  return cards[0]?.mode ?? null;
}
