import type { Order } from "@giftpop/contracts";
import { Types } from "mongoose";

import type { OrderDoc } from "./model";

const iso = (date: Date): string => date.toISOString();
const oid = (id: string): Types.ObjectId => new Types.ObjectId(id);

/** Stored order to the contract shape: hex ids, ISO dates, no Mongo internals. */
export function toOrder(doc: OrderDoc): Order {
  return {
    id: doc._id.toHexString(),
    number: doc.number,
    country: doc.country,
    contact: doc.contact,
    address: doc.address,
    design: doc.design,
    packaging: doc.packaging,
    items: doc.items,
    quote: doc.quote,
    paymentMode: doc.paymentMode,
    paymentStatus: doc.paymentStatus,
    status: doc.status,
    history: doc.history.map((entry) => ({
      from: entry.from,
      to: entry.to,
      at: iso(entry.at),
      actorId: entry.actorId ? entry.actorId.toHexString() : null,
      ...(entry.note === undefined ? {} : { note: entry.note }),
    })),
    shipment: doc.shipment
      ? {
          courier: doc.shipment.courier,
          trackingNumber: doc.shipment.trackingNumber,
          ...(doc.shipment.trackingUrl ? { trackingUrl: doc.shipment.trackingUrl } : {}),
          shippedAt: iso(new Date(doc.shipment.shippedAt)),
        }
      : null,
    payments: doc.payments.map((payment) => ({
      id: payment._id.toHexString(),
      kind: payment.kind,
      method: payment.method,
      amount: payment.amount,
      ...(payment.reference === undefined ? {} : { reference: payment.reference }),
      ...(payment.note === undefined ? {} : { note: payment.note }),
      recordedBy: payment.recordedBy.toHexString(),
      recordedAt: iso(payment.recordedAt),
    })),
    proofs: doc.proofs.map((proof) => ({
      id: proof._id.toHexString(),
      url: proof.url,
      status: proof.status,
      uploadedAt: iso(proof.uploadedAt),
    })),
    createdAt: iso(doc.createdAt),
    updatedAt: iso(doc.updatedAt),
  };
}

/** Id string to ObjectId, for actor ids coming from a staff session. */
export function toObjectId(id: string): Types.ObjectId {
  return oid(id);
}
