import type { AdminOrderDetail, PaymentRecordKind } from "@giftpop/contracts";

/** Every launch currency has two minor digits (see docs/decisions.md). */
const MINOR_DIGITS = 2;
const FACTOR = 10 ** MINOR_DIGITS;

export type AmountFailure =
  "empty" | "invalid" | "too_many_decimals" | "not_positive" | "too_large";

export type AmountParse = { ok: true; minor: number } | { ok: false; reason: AmountFailure };

const AMOUNT_PATTERN = /^(\d*)(?:\.(\d*))?$/;

/**
 * Turns typed major units ("12.50") into integer minor units (1250) by reading the decimal
 * string. It never uses a float and never rounds: three decimals is an error. Zero and
 * negative amounts are errors too.
 */
export function parseAmountToMinor(input: string): AmountParse {
  const text = input.trim();
  if (text === "") return { ok: false, reason: "empty" };
  const negative = text.startsWith("-");
  const match = AMOUNT_PATTERN.exec(negative ? text.slice(1) : text);
  const whole = match?.[1] ?? "";
  const fraction = match?.[2] ?? "";
  if (!match || (whole === "" && fraction === "")) return { ok: false, reason: "invalid" };
  if (negative) return { ok: false, reason: "not_positive" };
  if (fraction.length > MINOR_DIGITS) return { ok: false, reason: "too_many_decimals" };
  const minor =
    Number(whole === "" ? "0" : whole) * FACTOR + Number(fraction.padEnd(MINOR_DIGITS, "0"));
  if (!Number.isSafeInteger(minor)) return { ok: false, reason: "too_large" };
  if (minor <= 0) return { ok: false, reason: "not_positive" };
  return { ok: true, minor };
}

export const AMOUNT_MESSAGES: Record<AmountFailure, string> = {
  empty: "Enter the amount",
  invalid: "Enter an amount like 1250 or 1250.50",
  too_many_decimals: "Use at most 2 decimal places",
  not_positive: "The amount must be more than zero",
  too_large: "That amount is too large",
};

/** Minor units as a plain major-unit string for an input ("1250" becomes "12.50"). */
export function minorToInput(minor: number): string {
  return `${Math.floor(minor / FACTOR)}.${String(minor % FACTOR).padStart(MINOR_DIGITS, "0")}`;
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
  return minor > 0 ? minorToInput(minor) : "";
}

/** Why payments cannot be recorded, or null when they can. */
export function paymentBlockedReason(order: Pick<PaymentsView, "status">): string | null {
  if (order.status === "cancelled") return "This order is cancelled, so no payment can be recorded";
  if (order.status === "returned") return "This order was returned, so no payment can be recorded";
  return null;
}
