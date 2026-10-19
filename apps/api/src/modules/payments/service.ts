import type {
  Money,
  Order,
  PaymentMethod,
  PaymentRecordKind,
  PaymentStatus,
} from "@giftpop/contracts";
import mongoose, { type ClientSession } from "mongoose";

import { AppError } from "../../lib/errors";
import { enqueue } from "../notifications/service";
import { toObjectId, toOrder } from "../orders/mappers";
import { OrderModel, type OrderDoc } from "../orders/model";
import { transitionOrder } from "../orders/transition";

export interface RecordPaymentOptions {
  /** Defaults from the order: `advance` while short of the total, then `full` (or `balance` after an advance). */
  kind?: PaymentRecordKind;
  reference?: string;
  note?: string;
  session?: ClientSession;
}

const sumPaid = (doc: OrderDoc): number =>
  doc.payments.reduce((sum, p) => (p.kind === "refund" ? sum : sum + p.amount.amountMinor), 0);

function statusFor(paid: number, doc: OrderDoc): PaymentStatus {
  if (paid >= doc.quote.totalMinor) return "paid";
  if (doc.paymentMode === "cod" && paid >= doc.quote.dueNowMinor) return "advance_paid";
  return "unpaid";
}

function defaultKind(doc: OrderDoc, totalAfter: number): PaymentRecordKind {
  if (totalAfter < doc.quote.totalMinor) return "advance";
  return doc.payments.some((p) => p.kind === "advance") ? "balance" : "full";
}

/** The write lost a race: another payment landed between our read and our update. */
class PaymentRace extends Error {}

async function applyPayment(
  orderId: string,
  amount: Money,
  method: PaymentMethod,
  staffId: string,
  options: RecordPaymentOptions,
  session: ClientSession,
): Promise<Order> {
  const doc = await OrderModel.findById(orderId).session(session).lean<OrderDoc>();
  if (!doc) throw new AppError("NOT_FOUND", 404, "No order with that id");
  if (doc.quote.currency !== amount.currency) {
    throw new AppError(
      "VALIDATION_ERROR",
      422,
      `Payment must be in ${doc.quote.currency}, not ${amount.currency}`,
    );
  }
  if (doc.status === "cancelled" || doc.status === "returned") {
    throw new AppError("VALIDATION_ERROR", 422, `Cannot record a payment on a ${doc.status} order`);
  }

  const kind = options.kind ?? defaultKind(doc, sumPaid(doc) + amount.amountMinor);
  const paidAfter = sumPaid(doc) + (kind === "refund" ? 0 : amount.amountMinor);
  const overpaid = paidAfter - doc.quote.totalMinor;
  const notes = [
    options.note,
    overpaid > 0 ? `Overpayment of ${overpaid} minor units` : undefined,
  ].filter(Boolean);

  const record = {
    _id: new mongoose.Types.ObjectId(),
    kind,
    method,
    amount: { amountMinor: amount.amountMinor, currency: amount.currency },
    ...(options.reference ? { reference: options.reference } : {}),
    ...(notes.length ? { note: notes.join(". ") } : {}),
    recordedBy: toObjectId(staffId),
    recordedAt: new Date(),
  };

  // Applies only if no other payment was added since we read: the array length is the version.
  const updated = await OrderModel.findOneAndUpdate(
    { _id: doc._id, payments: { $size: doc.payments.length } },
    { $push: { payments: record }, $set: { paymentStatus: statusFor(paidAfter, doc) } },
    { returnDocument: "after", session },
  ).lean<OrderDoc>();
  if (!updated) throw new PaymentRace();

  let result = toOrder(updated);
  if (updated.status === "awaiting_payment" && paidAfter >= updated.quote.dueNowMinor) {
    result = await transitionOrder(orderId, "confirmed", {
      actorId: staffId,
      fields: { note: "Payment recorded" },
      session,
    });
  }

  await enqueue(
    {
      type: "payment_recorded",
      orderId,
      payload: {
        number: updated.number,
        amount: record.amount,
        paymentStatus: updated.paymentStatus,
      },
    },
    session,
  );
  return result;
}

const MAX_ATTEMPTS = 5;

async function applyWithRetry(
  orderId: string,
  amount: Money,
  method: PaymentMethod,
  staffId: string,
  options: RecordPaymentOptions,
  session: ClientSession,
): Promise<Order> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await applyPayment(orderId, amount, method, staffId, options, session);
    } catch (error) {
      if (!(error instanceof PaymentRace)) throw error;
      if (attempt >= MAX_ATTEMPTS) {
        throw new AppError("CONFLICT", 409, "This order was changed by someone else");
      }
    }
  }
}

/**
 * Records money received against an order (staff action; phase 4 exposes it over HTTP).
 * One transaction: payment record, payment status and, when `awaiting_payment` is now
 * covered, the move to `confirmed` through `transitionOrder` so it lands in the history.
 * The update is conditional on the payments array, so concurrent payments are all kept.
 */
export async function recordPayment(
  orderId: string,
  amount: Money,
  method: PaymentMethod,
  staffId: string,
  options: RecordPaymentOptions = {},
): Promise<Order> {
  if (!Number.isSafeInteger(amount.amountMinor) || amount.amountMinor <= 0) {
    throw new AppError("VALIDATION_ERROR", 422, "Payment amount must be a positive whole number");
  }
  if (options.session) {
    return applyWithRetry(orderId, amount, method, staffId, options, options.session);
  }

  const session = await mongoose.startSession();
  try {
    let result: Order | undefined;
    // withTransaction re-runs the callback on a write conflict, so a losing concurrent call re-reads.
    await session.withTransaction(async () => {
      result = await applyWithRetry(orderId, amount, method, staffId, options, session);
    });
    if (!result) throw new AppError("INTERNAL", 500, "Payment was not recorded");
    return result;
  } finally {
    await session.endSession();
  }
}
