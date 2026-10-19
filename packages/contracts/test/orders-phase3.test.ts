import { describe, expect, it } from "vitest";

import {
  OutboxEntrySchema,
  PaymentProofUploadFieldsSchema,
  PriceEntrySchema,
  PublicOrderViewSchema,
  SetPricesRequestSchema,
  snapshotsToSceneDocs,
  validateAddress,
} from "../src/index";

const id = (n: number) => String(n).padStart(24, "a");
const design = {
  packagingId: id(1),
  items: [{ itemId: id(2), qty: 2, slot: 0 }],
  wrapperColor: "#ffc0cb",
  ribbonColor: "#e6397a",
  arrangementSeed: 5,
  personalisation: { cardMessage: "", recipientName: "", itemNames: {} },
};
const packaging = {
  packagingId: id(1),
  name: "Bouquet",
  layoutType: "bouquet-fan",
  priceMinor: 168000,
  minItems: 6,
  maxItems: 10,
  capacityUnits: 16,
};
const item = {
  itemId: id(2),
  name: "Rose",
  shape: "flower" as const,
  color: "#ff0066",
  sizeUnits: 1,
  unitPriceMinor: 90000,
  qty: 2,
};
const quote = {
  currency: "PKR",
  mode: "cod",
  goodsMinor: 1,
  discountMinor: 0,
  shippingMinor: 0,
  totalMinor: 1,
  dueNowMinor: 0,
  dueOnDeliveryMinor: 1,
};

describe("validateAddress", () => {
  const format = {
    region: { required: true, label: "State" },
    postalCode: { required: false, label: "ZIP" },
  };
  it("asks for the fields the country requires, using its own labels", () => {
    expect(validateAddress({ line1: "1 Main", city: "Austin" }, format)).toEqual([
      { field: "region", message: "State is required" },
    ]);
  });
  it("treats blank text as missing and accepts a complete address", () => {
    expect(validateAddress({ line1: "1 Main", city: "Austin", region: "  " }, format)).toHaveLength(
      1,
    );
    expect(validateAddress({ line1: "1 Main", city: "Austin", region: "TX" }, format)).toEqual([]);
  });
  it("needs nothing extra when the country requires nothing", () => {
    const none = {
      region: { required: false, label: "County" },
      postalCode: { required: false, label: "Postcode" },
    };
    expect(validateAddress({ line1: "1 Main", city: "Leeds" }, none)).toEqual([]);
  });
});

describe("snapshotsToSceneDocs", () => {
  it("rebuilds drawable documents from the frozen snapshots and the design's colours", () => {
    const docs = snapshotsToSceneDocs({
      design,
      packaging: { ...packaging, layers: {} },
      items: [item],
    });
    expect(docs.packaging).toMatchObject({ id: id(1), layoutType: "bouquet-fan", maxItems: 10 });
    expect(docs.packaging.wrapperColors[0]?.hex).toBe("#ffc0cb");
    expect(docs.items).toHaveLength(1);
    expect(docs.items[0]).toMatchObject({ id: id(2), name: "Rose", shape: "flower" });
  });
});

describe("PublicOrderViewSchema", () => {
  const view = {
    number: "GP-PK-7K2M9Q",
    country: "PK",
    status: "awaiting_payment",
    paymentStatus: "unpaid",
    history: [{ to: "awaiting_payment", at: "2026-10-19T10:00:00.000Z" }],
    shipment: null,
    createdAt: "2026-10-19T10:00:00.000Z",
    paymentMode: "cod",
    quote,
    paymentInstructions: "Bank details",
    design,
    packaging: { ...packaging, layers: {} },
    items: [item],
    proofs: [],
  };
  it("accepts a full view and never carries staff data", () => {
    const parsed = PublicOrderViewSchema.parse({ ...view, actorId: id(9), note: "staff only" });
    expect(parsed).not.toHaveProperty("actorId");
    expect(parsed).not.toHaveProperty("note");
  });
  it("carries a tracking url only when there is one", () => {
    const shipped = {
      ...view,
      shipment: { courier: "TCS", trackingNumber: "123", trackingUrl: "https://t.example/123" },
    };
    expect(PublicOrderViewSchema.safeParse(shipped).success).toBe(true);
    expect(
      PublicOrderViewSchema.safeParse({
        ...view,
        shipment: { courier: "TCS", trackingNumber: "1", trackingUrl: "nope" },
      }).success,
    ).toBe(false);
  });
});

describe("stockQty", () => {
  const row = { country: "PK", priceMinor: 100, inStock: true };
  it("is optional and a whole non-negative number", () => {
    expect(PriceEntrySchema.safeParse(row).success).toBe(true);
    expect(PriceEntrySchema.safeParse({ ...row, stockQty: 3 }).success).toBe(true);
    expect(PriceEntrySchema.safeParse({ ...row, stockQty: -1 }).success).toBe(false);
    expect(PriceEntrySchema.safeParse({ ...row, stockQty: 1.5 }).success).toBe(false);
    expect(SetPricesRequestSchema.safeParse({ prices: [{ ...row, stockQty: 0 }] }).success).toBe(
      true,
    );
  });
});

describe("payment proof and outbox", () => {
  it("needs the order contact with the proof", () => {
    expect(PaymentProofUploadFieldsSchema.safeParse({ contact: "+92 300 1234567" }).success).toBe(
      true,
    );
    expect(PaymentProofUploadFieldsSchema.safeParse({ contact: "" }).success).toBe(false);
  });
  it("only knows the three notification types", () => {
    const entry = {
      id: id(3),
      type: "order_created",
      orderId: id(4),
      channel: "console",
      payload: { number: "GP-PK-7K2M9Q" },
      status: "pending",
      attempts: 0,
      nextAttemptAt: "2026-10-19T10:00:00.000Z",
      createdAt: "2026-10-19T10:00:00.000Z",
    };
    expect(OutboxEntrySchema.safeParse(entry).success).toBe(true);
    expect(OutboxEntrySchema.safeParse({ ...entry, type: "newsletter" }).success).toBe(false);
  });
});
