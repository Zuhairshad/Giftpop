import { ORDER_STATUSES, type OrderStatus, type PaymentStatus } from "@giftpop/contracts";

/**
 * The one place that decides how a status looks and reads in the admin: the list, the
 * detail page and the dashboard all use these, so a status never has two colours.
 * Staff-facing words (the customer's words live in the web app).
 */
export const ORDER_STATUS_LABELS: Readonly<Record<OrderStatus, string>> = {
  awaiting_payment: "Awaiting payment",
  confirmed: "Confirmed",
  in_production: "In production",
  packed: "Packed",
  shipped: "Shipped",
  out_for_delivery: "Out for delivery",
  delivery_failed: "Delivery failed",
  delivered: "Delivered",
  returned: "Returned",
  cancelled: "Cancelled",
};

/** Tailwind classes for a status pill: one colour per status, light and dark. */
export const ORDER_STATUS_STYLES: Readonly<Record<OrderStatus, string>> = {
  awaiting_payment: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  confirmed: "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200",
  in_production: "bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-200",
  packed: "bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200",
  shipped: "bg-cyan-100 text-cyan-900 dark:bg-cyan-950 dark:text-cyan-200",
  out_for_delivery: "bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-200",
  delivery_failed: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
  delivered: "bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-200",
  returned: "bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200",
  cancelled: "bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
};

export const PAYMENT_STATUS_LABELS: Readonly<Record<PaymentStatus, string>> = {
  unpaid: "Unpaid",
  advance_paid: "Advance paid",
  paid: "Paid",
  refunded: "Refunded",
};

export const PAYMENT_STATUS_STYLES: Readonly<Record<PaymentStatus, string>> = {
  unpaid: "bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
  advance_paid: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  paid: "bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-200",
  refunded: "bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-200",
};

export { ORDER_STATUSES };
