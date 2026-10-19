import type {
  AdminOrderDetail,
  Order,
  RecordPaymentRequest,
  TransitionFields,
  OrderStatus,
} from "@giftpop/contracts";
import mongoose from "mongoose";

import { AppError } from "../../lib/errors";
import type { ReadableStorage, StoredObject } from "../../lib/storage";
import { releaseStock, type StockLine } from "../catalog/stock.service";
import { toObjectId, toOrder } from "../orders/mappers";
import { OrderModel, type OrderDoc } from "../orders/model";
import { transitionOrder } from "../orders/transition";
import { proofStorageKey } from "../payments/proof-keys";
import { recordPayment } from "../payments/service";
import { StaffModel } from "../staff/model";

const notFound = () => new AppError("NOT_FOUND", 404, "No order with that id");

/** Adds staff names to ids with ONE query; a deleted account gives null. */
async function withActorNames(order: Order): Promise<AdminOrderDetail> {
  const ids = new Set<string>();
  for (const entry of order.history) if (entry.actorId) ids.add(entry.actorId);
  for (const payment of order.payments) ids.add(payment.recordedBy);
  for (const note of order.notes) ids.add(note.actorId);

  const names = new Map<string, string>();
  if (ids.size > 0) {
    const staff = await StaffModel.find({ _id: { $in: [...ids].map(toObjectId) } })
      .select("name")
      .lean();
    for (const person of staff) names.set(person._id.toHexString(), person.name);
  }
  const nameOf = (id: string | null): string | null => (id ? (names.get(id) ?? null) : null);

  return {
    ...order,
    history: order.history.map((entry) => ({ ...entry, actorName: nameOf(entry.actorId) })),
    payments: order.payments.map((p) => ({ ...p, recordedByName: nameOf(p.recordedBy) })),
    notes: order.notes.map((note) => ({ ...note, actorName: nameOf(note.actorId) })),
  };
}

export async function getOrderDetail(orderId: string): Promise<AdminOrderDetail> {
  const doc = await OrderModel.findById(orderId).lean<OrderDoc>();
  if (!doc) throw notFound();
  return withActorNames(toOrder(doc));
}

function stockLinesFor(order: Order): StockLine[] {
  const perItem = new Map<string, number>();
  for (const item of order.items) {
    perItem.set(item.itemId, (perItem.get(item.itemId) ?? 0) + item.qty);
  }
  return [
    { kind: "packaging", targetId: order.packaging.packagingId, country: order.country, qty: 1 },
    ...[...perItem].map(([targetId, qty]): StockLine => ({
      kind: "item",
      targetId,
      country: order.country,
      qty,
    })),
  ];
}

/** One transaction: the state machine move and, for a cancellation, the stock coming back. */
export async function changeStatus(
  orderId: string,
  to: OrderStatus,
  fields: TransitionFields,
  staffId: string,
): Promise<AdminOrderDetail> {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const order = await transitionOrder(orderId, to, { actorId: staffId, fields, session });
      if (to === "cancelled") await releaseStock(stockLinesFor(order), session);
    });
  } finally {
    await session.endSession();
  }
  return getOrderDetail(orderId);
}

export async function addPayment(
  orderId: string,
  request: RecordPaymentRequest,
  staffId: string,
): Promise<AdminOrderDetail> {
  const doc = await OrderModel.findById(orderId).select("quote.currency").lean<OrderDoc>();
  if (!doc) throw notFound();
  await recordPayment(
    orderId,
    { amountMinor: request.amountMinor, currency: doc.quote.currency },
    request.method,
    staffId,
    { kind: request.kind, reference: request.reference, note: request.note },
  );
  return getOrderDetail(orderId);
}

export async function addNote(
  orderId: string,
  text: string,
  staffId: string,
): Promise<AdminOrderDetail> {
  const updated = await OrderModel.findByIdAndUpdate(orderId, {
    $push: { notes: { text, actorId: toObjectId(staffId), at: new Date() } },
  }).lean<OrderDoc>();
  if (!updated) throw notFound();
  return getOrderDetail(orderId);
}

export async function reviewProof(
  orderId: string,
  proofId: string,
  status: "accepted" | "rejected",
): Promise<AdminOrderDetail> {
  const result = await OrderModel.updateOne(
    { _id: orderId, "proofs._id": toObjectId(proofId) },
    { $set: { "proofs.$.status": status } },
  );
  if (result.matchedCount === 0) {
    throw new AppError("NOT_FOUND", 404, "No such order or payment proof");
  }
  return getOrderDetail(orderId);
}

/** The bytes of one payment proof, from private storage. 404 if the order, proof or object is missing. */
export async function getProofFile(
  storage: ReadableStorage,
  orderId: string,
  proofId: string,
): Promise<StoredObject> {
  const doc = await OrderModel.findOne(
    { _id: orderId, "proofs._id": toObjectId(proofId) },
    { "proofs.$": 1 },
  ).lean<Pick<OrderDoc, "proofs">>();
  const proof = doc?.proofs[0];
  const key = proof && proofStorageKey(proof);
  const object = key ? await storage.get(key) : null;
  if (!object) throw new AppError("NOT_FOUND", 404, "No such payment proof image");
  return object;
}
