// Test helpers for order tests. Not imported by app code.
import type { OrderStatus } from "@giftpop/contracts";
import { Types } from "mongoose";

import { OrderModel, type OrderDoc } from "./model";

export function orderDocInput(
  overrides: Partial<OrderDoc> = {},
): Omit<OrderDoc, "_id" | "createdAt" | "updatedAt"> {
  const packagingId = new Types.ObjectId().toHexString();
  const itemId = new Types.ObjectId().toHexString();
  return {
    number: `GP-PK-${Math.random()
      .toString(36)
      .slice(2, 8)
      .toUpperCase()
      .replace(/[ILOU]/g, "7")}`,
    country: "PK",
    contact: { name: "Sara Khan", email: "sara@example.com", phone: "+92 300 1234567" },
    address: { line1: "12 Garden Road", city: "Lahore" },
    design: {
      packagingId,
      items: [{ itemId, qty: 2, slot: 0 }],
      wrapperColor: "#c9a977",
      ribbonColor: "#c0392b",
      arrangementSeed: 7,
      personalisation: { cardMessage: "Happy birthday", recipientName: "Sara", customRequest: "", itemNames: {} },
    },
    packaging: {
      packagingId,
      name: "Bouquet",
      layoutType: "bouquet-fan",
      priceMinor: 90_000,
      minItems: 2,
      maxItems: 4,
      capacityUnits: 8,
      layers: {},
    },
    items: [
      {
        itemId,
        name: "Dark chocolate bar",
        shape: "bar",
        color: "#4a2c1a",
        sizeUnits: 1,
        unitPriceMinor: 45_000,
        qty: 2,
      },
    ],
    quote: {
      currency: "PKR",
      mode: "cod",
      goodsMinor: 180_000,
      discountMinor: 0,
      shippingMinor: 25_000,
      totalMinor: 205_000,
      dueNowMinor: 41_000,
      dueOnDeliveryMinor: 164_000,
    },
    paymentMode: "cod",
    paymentStatus: "unpaid",
    status: "awaiting_payment",
    history: [{ from: null, to: "awaiting_payment", at: new Date(), actorId: null }],
    shipment: null,
    payments: [],
    proofs: [],
    notes: [],
    ...overrides,
  };
}

/** Stores an order in the given status and returns its id. */
export async function insertOrder(
  status: OrderStatus = "awaiting_payment",
  overrides: Partial<OrderDoc> = {},
): Promise<string> {
  const doc = await OrderModel.create(orderDocInput({ status, ...overrides }));
  return doc._id.toHexString();
}
