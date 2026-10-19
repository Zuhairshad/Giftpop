import { ORDER_STATUSES, type NotificationType, type OrderStatus } from "@giftpop/contracts";

import type { OrderDoc } from "../orders/model";

/** The only order fields a template may read. Staff notes (history) are not here. */
export type TemplateOrder = Pick<
  OrderDoc,
  "number" | "paymentMode" | "paymentStatus" | "status" | "quote" | "shipment"
>;

export interface TemplateOptions {
  /** Public origin of the store, for the tracking link. */
  trackBaseUrl: string;
}

export interface RenderedMessage {
  subject: string;
  text: string;
}

/** Plain text amount from integer minor units, two minor digits (see docs/decisions.md). */
export function formatMinor(amountMinor: number, currency: string): string {
  const sign = amountMinor < 0 ? "-" : "";
  const abs = Math.abs(amountMinor);
  const cents = String(abs % 100).padStart(2, "0");
  return `${sign}${currency} ${Math.trunc(abs / 100)}.${cents}`;
}

export function trackingLink(order: TemplateOrder, options: TemplateOptions): string {
  const base = options.trackBaseUrl.replace(/\/+$/, "");
  return `${base}/track?number=${encodeURIComponent(order.number)}`;
}

function isStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && (ORDER_STATUSES as readonly string[]).includes(value);
}

function str(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function statusLines(order: TemplateOrder, status: OrderStatus): string[] {
  switch (status) {
    case "awaiting_payment":
      return ["Your order is waiting for payment."];
    case "confirmed":
      return ["Your order is confirmed. We will start making it soon."];
    case "in_production":
      return ["Your gift is being made by hand."];
    case "packed":
      return ["Your gift is packed and waiting for the courier."];
    case "shipped": {
      const lines = ["Your gift has been shipped."];
      if (order.shipment) {
        lines.push(`Courier: ${order.shipment.courier}`);
        lines.push(`Tracking number: ${order.shipment.trackingNumber}`);
        if (order.shipment.trackingUrl)
          lines.push(`Courier tracking: ${order.shipment.trackingUrl}`);
      }
      return lines;
    }
    case "out_for_delivery":
      return ["Your gift is out for delivery today."];
    case "delivered":
      return ["Your gift was delivered. We hope they love it."];
    case "delivery_failed":
      return [
        "The courier could not deliver your gift. They will try again, or we will contact you.",
      ];
    case "returned":
      return ["Your gift came back to us. We will contact you about what to do next."];
    case "cancelled":
      return ["Your order was cancelled."];
  }
}

const STATUS_SUBJECT: Record<OrderStatus, string> = {
  awaiting_payment: "is waiting for payment",
  confirmed: "is confirmed",
  in_production: "is being made",
  packed: "is packed",
  shipped: "has shipped",
  out_for_delivery: "is out for delivery",
  delivered: "was delivered",
  delivery_failed: "could not be delivered",
  returned: "was returned",
  cancelled: "was cancelled",
};

function orderCreated(
  order: TemplateOrder,
  payload: Record<string, unknown>,
  options: TemplateOptions,
): RenderedMessage {
  const { quote } = order;
  const lines = [`Thank you for your order ${order.number}.`, ""];
  if (order.paymentMode === "prepaid") {
    lines.push(`Pay ${formatMinor(quote.dueNowMinor, quote.currency)} now to confirm your order.`);
  } else {
    lines.push(
      `Pay ${formatMinor(quote.dueNowMinor, quote.currency)} now as an advance to confirm your order.`,
      `Pay the remaining ${formatMinor(quote.dueOnDeliveryMinor, quote.currency)} when it is delivered.`,
    );
  }
  const instructions = str(payload["paymentInstructions"]);
  if (instructions) lines.push("", "How to pay:", instructions);
  lines.push(
    "",
    `Order total: ${formatMinor(quote.totalMinor, quote.currency)}`,
    `Track your order: ${trackingLink(order, options)}`,
    "You will need this order number and your phone or email.",
  );
  return { subject: `Your Giftpop order ${order.number}`, text: lines.join("\n") };
}

const PAYMENT_STATUS_WORDS: Record<string, string> = {
  advance_paid: "advance received",
  paid: "paid in full",
  refunded: "refunded",
  unpaid: "not paid yet",
};

function paymentRecorded(
  order: TemplateOrder,
  payload: Record<string, unknown>,
  options: TemplateOptions,
): RenderedMessage {
  const currency = str(payload["currency"]) ?? order.quote.currency;
  const amount = payload["amountMinor"];
  const paymentStatus = str(payload["paymentStatus"]) ?? order.paymentStatus;
  const status = isStatus(payload["status"]) ? payload["status"] : order.status;
  const lines = [
    typeof amount === "number" && Number.isSafeInteger(amount)
      ? `We received ${formatMinor(amount, currency)} for order ${order.number}.`
      : `We received your payment for order ${order.number}.`,
    `Payment: ${PAYMENT_STATUS_WORDS[paymentStatus] ?? paymentStatus}.`,
    ...statusLines(order, status),
    "",
    `Track your order: ${trackingLink(order, options)}`,
  ];
  return { subject: `Payment received for ${order.number}`, text: lines.join("\n") };
}

function statusChanged(
  order: TemplateOrder,
  payload: Record<string, unknown>,
  options: TemplateOptions,
): RenderedMessage {
  const status = isStatus(payload["status"]) ? payload["status"] : order.status;
  const lines = [
    `Update on order ${order.number}:`,
    ...statusLines(order, status),
    "",
    `Track your order: ${trackingLink(order, options)}`,
  ];
  return {
    subject: `Your order ${order.number} ${STATUS_SUBJECT[status]}`,
    text: lines.join("\n"),
  };
}

/** Pure: builds the customer message from the order's customer-facing fields and the payload. */
export function renderNotification(
  type: Exclude<NotificationType, "staff_alert">,
  order: TemplateOrder,
  payload: Record<string, unknown>,
  options: TemplateOptions,
): RenderedMessage {
  switch (type) {
    case "order_created":
      return orderCreated(order, payload, options);
    case "payment_recorded":
      return paymentRecorded(order, payload, options);
    case "status_changed":
      return statusChanged(order, payload, options);
  }
}
