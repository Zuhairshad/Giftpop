import type { OrderStatus, PaymentStatus } from "@giftpop/contracts";

/** Customer-facing words for every fulfilment status. Shared by the order and track pages. */
export const STATUS_LABELS: Readonly<Record<OrderStatus, string>> = {
  awaiting_payment: "Waiting for your payment",
  confirmed: "Payment confirmed",
  in_production: "Being made by hand",
  packed: "Packed and ready for the courier",
  shipped: "Shipped",
  out_for_delivery: "Out for delivery",
  delivery_failed: "Delivery attempt failed",
  delivered: "Delivered",
  returned: "Returned to us",
  cancelled: "Cancelled",
};

/** One plain sentence under the label. */
export const STATUS_HINTS: Readonly<Record<OrderStatus, string>> = {
  awaiting_payment: "Send your payment and we will confirm it.",
  confirmed: "We have your payment and will start on your gift.",
  in_production: "We are making your gift by hand.",
  packed: "Your gift is packed. The courier will collect it soon.",
  shipped: "Your gift is with the courier.",
  out_for_delivery: "The courier is on the way to the address.",
  delivery_failed: "The courier could not deliver. We will try again or get in touch.",
  delivered: "Your gift has arrived.",
  returned: "The gift came back to us.",
  cancelled: "This order was cancelled.",
};

export const PAYMENT_LABELS: Readonly<Record<PaymentStatus, string>> = {
  unpaid: "Not paid yet",
  advance_paid: "Advance paid",
  paid: "Paid in full",
  refunded: "Refunded",
};

export function statusLabel(status: OrderStatus): string {
  return STATUS_LABELS[status];
}

export function statusHint(status: OrderStatus): string {
  return STATUS_HINTS[status];
}

export function paymentLabel(status: PaymentStatus): string {
  return PAYMENT_LABELS[status];
}

const ISSUE: readonly OrderStatus[] = ["delivery_failed", "returned", "cancelled"];
const DONE: readonly OrderStatus[] = ["delivered"];

/** Tailwind classes for the status pill. Never colour alone: the label always shows. */
export function statusTone(status: OrderStatus): string {
  if (ISSUE.includes(status)) return "bg-butter text-on-accent";
  if (DONE.includes(status)) return "bg-mint text-on-accent";
  return "bg-pink-soft text-foreground";
}

const DATE = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** A date only (UTC, fixed locale so server and browser agree). Empty for an invalid value. */
export function formatDate(iso: string): string {
  const time = Date.parse(iso);
  return Number.isNaN(time) ? "" : DATE.format(time);
}
