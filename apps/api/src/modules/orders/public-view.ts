import type { PublicOrderView } from "@giftpop/contracts";

import type { OrderDoc } from "./model";

/**
 * The customer's view of an order. Built field by field so nothing staff-only can
 * leak: no history notes or actor ids, no payment records, no internal ids, and
 * proofs reduced to when and what state. Shared by tracking, the payments module
 * and the order page.
 */
export function toPublicOrderView(doc: OrderDoc, paymentInstructions: string): PublicOrderView {
  return {
    number: doc.number,
    country: doc.country,
    status: doc.status,
    paymentStatus: doc.paymentStatus,
    history: doc.history.map((entry) => ({ to: entry.to, at: entry.at.toISOString() })),
    shipment: doc.shipment
      ? {
          courier: doc.shipment.courier,
          trackingNumber: doc.shipment.trackingNumber,
          ...(doc.shipment.trackingUrl ? { trackingUrl: doc.shipment.trackingUrl } : {}),
        }
      : null,
    createdAt: doc.createdAt.toISOString(),
    paymentMode: doc.paymentMode,
    quote: doc.quote,
    paymentInstructions,
    design: doc.design,
    packaging: doc.packaging,
    items: doc.items,
    proofs: doc.proofs.map((proof) => ({
      uploadedAt: proof.uploadedAt.toISOString(),
      status: proof.status,
    })),
  };
}
