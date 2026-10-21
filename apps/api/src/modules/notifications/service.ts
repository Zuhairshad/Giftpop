import {
  NotificationTypeSchema,
  ObjectIdSchema,
  type NotificationChannel,
  type NotificationType,
} from "@giftpop/contracts";
import type { ClientSession } from "mongoose";
import { z } from "zod";

import { createLogger } from "../../logger";
import { OrderModel, type OrderDoc } from "../orders/model";

import { OutboxModel, type OutboxDoc } from "./model";
import {
  renderNotification,
  renderOrderLookup,
  type TemplateOptions,
  type TemplateOrder,
} from "./templates";
import {
  createConsoleTransport,
  hasTransport,
  registeredTransports,
  type MinimalLogger,
  type TransportMap,
} from "./transports";

export interface EnqueueInput {
  type: NotificationType;
  orderId: string;
  /** What the template needs. Never staff notes. */
  payload: Record<string, unknown>;
}

const EnqueueInputSchema = z.object({
  type: NotificationTypeSchema,
  orderId: ObjectIdSchema,
  payload: z.record(z.string(), z.unknown()),
});

/** Delay after the nth failed attempt. The fifth failure marks the entry failed. */
export const BACKOFF_MS = [30_000, 120_000, 600_000, 3_600_000, 21_600_000] as const;
export const MAX_ATTEMPTS = BACKOFF_MS.length;
/** A claimed entry is hidden from other workers for this long, in case this worker dies. */
const LEASE_MS = 5 * 60_000;
const DEFAULT_BATCH = 20;
const DEFAULT_TRACK_BASE_URL = "http://localhost:3000";

/** Channels that get an entry: the console always, email only when a provider is registered. */
function channels(): NotificationChannel[] {
  return hasTransport("email") ? ["console", "email"] : ["console"];
}

/**
 * Queues a message in the outbox, one entry per channel. Call it with the session of
 * the transaction that caused it, so the message exists if and only if the change does.
 * It never touches a transport, so transport problems cannot reach the caller. Invalid
 * input is a programming error and throws.
 */
export async function enqueue(input: EnqueueInput, session?: ClientSession): Promise<void> {
  const { type, orderId, payload } = EnqueueInputSchema.parse(input);
  const docs = channels().map((channel) => ({ type, orderId, channel, payload }));
  await OutboxModel.create(docs, { session, ordered: true });
}

export interface StaffAlertInput {
  subject: string;
  /** Plain text. Never put a customer's or partner's contact details in it: it is logged. */
  text: string;
}

const StaffAlertSchema = z.object({
  subject: z.string().min(1).max(200),
  text: z.string().min(1).max(2000),
});

/**
 * Queues a message for the team (for example a new partner request). It has no order
 * and goes to the console channel only until staff recipients are configured. Same
 * transaction rule as `enqueue`.
 */
export async function enqueueStaffAlert(
  input: StaffAlertInput,
  session?: ClientSession,
): Promise<void> {
  const payload = StaffAlertSchema.parse(input);
  await OutboxModel.create([{ type: "staff_alert", channel: "console", payload }], {
    session,
    ordered: true,
  });
}

const OrderLookupPayloadSchema = z.object({
  email: z.string().min(3),
  numbers: z.array(z.string().min(1)).min(1).max(10),
});

/** Same email asked again within this window is ignored, so the form cannot be used to flood an inbox. */
export const LOOKUP_COOLDOWN_MS = 10 * 60_000;

/**
 * Queues the "forgot your order number" email. Email channel only (the console log would print
 * the address), and nothing at all when no email provider is registered. Returns whether it queued.
 */
export async function enqueueOrderLookup(
  input: { email: string; numbers: string[] },
  now: Date = new Date(),
): Promise<boolean> {
  if (!hasTransport("email")) return false;
  const payload = OrderLookupPayloadSchema.parse(input);
  const recent = await OutboxModel.exists({
    type: "order_lookup",
    "payload.email": payload.email,
    createdAt: { $gte: new Date(now.getTime() - LOOKUP_COOLDOWN_MS) },
  });
  if (recent) return false;
  await OutboxModel.create({ type: "order_lookup", channel: "email", payload });
  return true;
}

export interface ProcessOptions {
  now?: Date;
  batchSize?: number;
  /** Overrides the registered transports and the default console transport, per channel. */
  transports?: TransportMap;
  logger?: MinimalLogger;
  /** Public origin of the store, for tracking links. */
  trackBaseUrl?: string;
}

let defaultLogger: MinimalLogger | undefined;

function resolveTransports(options: ProcessOptions): TransportMap {
  defaultLogger ??= createLogger({ LOG_LEVEL: "info", NODE_ENV: "development" });
  return {
    console: createConsoleTransport(options.logger ?? defaultLogger),
    ...registeredTransports(),
    ...options.transports,
  };
}

/** Atomically takes one due pending entry, so two workers never send the same one. */
async function claimNext(now: Date): Promise<OutboxDoc | null> {
  return OutboxModel.findOneAndUpdate(
    { status: "pending", nextAttemptAt: { $lte: now } },
    { $set: { nextAttemptAt: new Date(now.getTime() + LEASE_MS) } },
    { sort: { nextAttemptAt: 1 }, returnDocument: "before" },
  ).lean<OutboxDoc>();
}

function describeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.slice(0, 500);
}

async function deliver(
  entry: OutboxDoc,
  transports: TransportMap,
  template: TemplateOptions,
): Promise<void> {
  const transport = transports[entry.channel];
  if (!transport) throw new Error(`No transport registered for channel ${entry.channel}`);
  if (entry.type === "staff_alert") {
    const alert = StaffAlertSchema.parse(entry.payload);
    await transport.send({
      type: entry.type,
      orderNumber: "",
      to: { email: "", phone: "" },
      subject: alert.subject,
      text: alert.text,
    });
    return;
  }
  if (entry.type === "order_lookup") {
    const payload = OrderLookupPayloadSchema.parse(entry.payload);
    const { subject, text } = renderOrderLookup(payload.numbers, template);
    await transport.send({
      type: entry.type,
      orderNumber: "",
      to: { email: payload.email, phone: "" },
      subject,
      text,
    });
    return;
  }
  const order = await OrderModel.findById(entry.orderId).lean<OrderDoc>();
  if (!order) throw new Error("Order not found");
  const templateOrder: TemplateOrder = {
    number: order.number,
    paymentMode: order.paymentMode,
    paymentStatus: order.paymentStatus,
    status: order.status,
    quote: order.quote,
    shipment: order.shipment,
  };
  const { subject, text } = renderNotification(entry.type, templateOrder, entry.payload, template);
  await transport.send({
    type: entry.type,
    orderNumber: order.number,
    to: { email: order.contact.email, phone: order.contact.phone },
    subject,
    text,
  });
}

async function recordFailure(entry: OutboxDoc, error: unknown, now: Date): Promise<void> {
  const attempts = entry.attempts + 1;
  const exhausted = attempts >= MAX_ATTEMPTS;
  const delay = BACKOFF_MS[Math.min(attempts, MAX_ATTEMPTS) - 1] ?? 21_600_000;
  await OutboxModel.updateOne(
    { _id: entry._id },
    {
      $set: {
        attempts,
        lastError: describeError(error),
        status: exhausted ? "failed" : "pending",
        nextAttemptAt: new Date(now.getTime() + delay),
      },
    },
  );
}

/**
 * Sends due messages. A failing transport never throws out of here: the entry is
 * rescheduled with backoff, and marked failed after five attempts. Returns the number sent.
 */
export async function processOutbox(options: ProcessOptions = {}): Promise<number> {
  const now = options.now ?? new Date();
  const batchSize = options.batchSize ?? DEFAULT_BATCH;
  const transports = resolveTransports(options);
  const template: TemplateOptions = {
    trackBaseUrl: options.trackBaseUrl ?? DEFAULT_TRACK_BASE_URL,
  };

  let sent = 0;
  for (let i = 0; i < batchSize; i += 1) {
    const entry = await claimNext(now);
    if (!entry) break;
    try {
      await deliver(entry, transports, template);
      await OutboxModel.updateOne({ _id: entry._id }, { $set: { status: "sent" } });
      sent += 1;
    } catch (error) {
      try {
        await recordFailure(entry, error, now);
      } catch {
        // The lease keeps the entry hidden for a while; it is retried after that.
      }
    }
  }
  return sent;
}
