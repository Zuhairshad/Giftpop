import { randomBytes } from "node:crypto";

import type { PaymentProofUploadResponse } from "@giftpop/contracts";

import { AppError } from "../../lib/errors";
import type { Storage } from "../../lib/storage";
import { convertToWebp } from "../assets/image";
import { contactMatches } from "../orders/contact";
import { OrderModel, type OrderDoc } from "../orders/model";

export const MAX_PROOFS_PER_ORDER = 5;

// Identical for an unknown number and a wrong contact, so numbers cannot be probed.
const notFound = (): AppError => new AppError("NOT_FOUND", 404, "We could not find that order");

/**
 * Stores a customer's payment proof image and adds it to the order, if the order accepts one.
 * `storage` must be the private storage: a proof is never given a public URL.
 */
export async function addPaymentProof(
  storage: Storage,
  number: string,
  contact: string,
  file: Buffer,
): Promise<PaymentProofUploadResponse> {
  const order = await OrderModel.findOne({ number: number.toUpperCase() }).lean<OrderDoc>();
  if (!order || !contactMatches(order.contact, contact)) throw notFound();
  if (order.status !== "awaiting_payment") {
    throw new AppError("CONFLICT", 409, "This order is no longer waiting for payment");
  }
  if (order.proofs.length >= MAX_PROOFS_PER_ORDER) {
    throw new AppError("CONFLICT", 409, `At most ${MAX_PROOFS_PER_ORDER} proofs per order`);
  }

  const image = await convertToWebp(file);
  const key = `proofs/${randomBytes(24).toString("base64url")}.webp`;
  await storage.put(key, image.data, "image/webp");

  const uploadedAt = new Date();
  // The filter keeps the cap exact under concurrent uploads.
  const updated = await OrderModel.findOneAndUpdate(
    {
      _id: order._id,
      status: "awaiting_payment",
      [`proofs.${MAX_PROOFS_PER_ORDER - 1}`]: { $exists: false },
    },
    // `url` is never read back (the mapper builds the staff file route); it holds the key.
    { $push: { proofs: { url: key, storageKey: key, status: "pending", uploadedAt } } },
    { returnDocument: "after" },
  ).lean<OrderDoc>();
  if (!updated) {
    await storage.delete(key);
    throw new AppError("CONFLICT", 409, "This order can no longer take a payment proof");
  }
  const proof = updated.proofs[updated.proofs.length - 1];
  if (!proof) throw new AppError("INTERNAL", 500, "Proof was not saved");
  return {
    proof: { id: proof._id.toHexString(), status: "pending", uploadedAt: uploadedAt.toISOString() },
  };
}
