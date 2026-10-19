import { majorToMinor, minorDigits, minorToMajor } from "@giftpop/contracts";
import type { AdminOrderDetail, PaymentRecordKind } from "@giftpop/contracts";

export type AmountFailure =
  "empty" | "invalid" | "too_many_decimals" | "not_positive" | "too_large";

export type AmountParse = { ok: true; minor: number } | { ok: false; reason: AmountFailure };

/**
 * Turns typed major units ("12.50") into integer minor units of the order's currency (1250) by
 * reading the decimal string (`majorToMinor` in contracts). It never uses a float and never
 * rounds: more decimals than the currency has is an error. Zero and negative amounts are errors.
 */
export function parseAmountToMinor(input: string, currency: string): AmountParse {
  const text = input.trim();
  if (text === "") return { ok: false, reason: "empty" };
  if (text.startsWith("-")) {
    return majorToMinor(text.slice(1), currency) === null
      ? { ok: false, reason: "invalid" }
      : { ok: false, reason: "not_positive" };
  }
  if (!/^\d*(?:\.\d*)?$/.test(text) || text === ".") return { ok: false, reason: "invalid" };
  const fraction = text.split(".")[1] ?? "";
  if (fraction.length > minorDigits(currency)) return { ok: false, reason: "too_many_decimals" };
  const minor = majorToMinor(text, currency);
  if (minor === null) return { ok: false, reason: "too_large" };
  if (minor <= 0) return { ok: false, reason: "not_positive" };
  return { ok: true, minor };
}

export const AMOUNT_MESSAGES: Record<AmountFailure, string> = {
  empty: "Enter the amount",
  invalid: "Enter an amount like 1250 or 1250.50",
  too_many_decimals: "Too many decimal places for this currency",
  not_positive: "The amount must be more than zero",
  too_large: "That amount is too large",
};

/** Minor units as a plain major-unit string for an input ("1250" USD becomes "12.50"). */
export function minorToInput(minor: number, currency: string): string {
  return minorToMajor(minor, currency);
}

type PaymentsView = Pick<AdminOrderDetail, "payments" | "quote" | "paymentMode" | "status">;

/** Money received so far: payments minus refunds, in integer minor units. */
export function receivedMinor(order: Pick<PaymentsView, "payments">): number {
  let sum = 0;
  for (const payment of order.payments) {
    sum += payment.kind === "refund" ? -payment.amount.amountMinor : payment.amount.amountMinor;
  }
  return Math.max(0, sum);
}

/** What is still to be paid: total minus received, never below zero. */
export function remainingDueMinor(order: PaymentsView): number {
  return Math.max(0, order.quote.totalMinor - receivedMinor(order));
}

/** advance for a cod order below the total, balance when money is already in, full otherwise. */
export function defaultPaymentKind(order: PaymentsView): PaymentRecordKind {
  const hasPayment = order.payments.some((payment) => payment.kind !== "refund");
  if (hasPayment && remainingDueMinor(order) > 0) return "balance";
  if (
    !hasPayment &&
    order.paymentMode === "cod" &&
    order.quote.dueNowMinor < order.quote.totalMinor
  ) {
    return "advance";
  }
  return "full";
}

/** The amount to suggest for a kind: the advance for "advance", everything still due otherwise. */
export function suggestedAmountMinor(order: PaymentsView, kind: PaymentRecordKind): number {
  const remaining = remainingDueMinor(order);
  if (kind === "advance") return Math.min(order.quote.dueNowMinor, remaining);
  if (kind === "refund") return 0;
  return remaining;
}

/** The suggested amount as typed text; empty when there is nothing to suggest (a refund). */
export function suggestedAmountInput(order: PaymentsView, kind: PaymentRecordKind): string {
  const minor = suggestedAmountMinor(order, kind);
  return minor > 0 ? minorToInput(minor, order.quote.currency) : "";
}

/** Why payments cannot be recorded, or null when they can. */
export function paymentBlockedReason(order: Pick<PaymentsView, "status">): string | null {
  if (order.status === "cancelled") return "This order is cancelled, so no payment can be recorded";
  if (order.status === "returned") return "This order was returned, so no payment can be recorded";
  return null;
}
