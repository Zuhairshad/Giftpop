import { describe, expect, it } from "vitest";

import {
  CreateOrderRequestSchema,
  ORDER_NUMBER_ALPHABET,
  OrderNumberSchema,
  PublicTrackingViewSchema,
  TrackOrderRequestSchema,
} from "../src/index";

import { id } from "./helpers";

describe("OrderNumberSchema", () => {
  it("accepts the documented example", () => {
    expect(OrderNumberSchema.safeParse("GP-PK-7K2M9Q").success).toBe(true);
  });

  it("accepts any launch country with any base32 characters", () => {
    for (const country of ["US", "GB", "SA", "IN", "PK", "CN", "AU", "TR", "CA"]) {
      expect(OrderNumberSchema.safeParse(`GP-${country}-000000`).success).toBe(true);
      expect(OrderNumberSchema.safeParse(`GP-${country}-ZZZZZZ`).success).toBe(true);
    }
  });

  it("accepts every character of the alphabet and the alphabet has 32 of them", () => {
    expect(ORDER_NUMBER_ALPHABET).toHaveLength(32);
    expect(new Set(ORDER_NUMBER_ALPHABET).size).toBe(32);
    for (const char of ORDER_NUMBER_ALPHABET) {
      expect(OrderNumberSchema.safeParse(`GP-PK-${char.repeat(6)}`).success).toBe(true);
    }
  });

  it.each(["I", "L", "O", "U"])("rejects the ambiguous character %s", (char) => {
    expect(ORDER_NUMBER_ALPHABET).not.toContain(char);
    expect(OrderNumberSchema.safeParse(`GP-PK-7K2M9${char}`).success).toBe(false);
  });

  it.each([
    ["wrong prefix", "XX-PK-7K2M9Q"],
    ["lower case body", "GP-PK-7k2m9q"],
    ["lower case country", "GP-pk-7K2M9Q"],
    ["5 chars", "GP-PK-7K2M9"],
    ["7 chars", "GP-PK-7K2M9QA"],
    ["country too long", "GP-PKK-7K2M9Q"],
    ["country one letter", "GP-P-7K2M9Q"],
    ["numeric country", "GP-12-7K2M9Q"],
    ["no prefix", "PK-7K2M9Q"],
    ["spaces", "GP-PK-7K2M9Q "],
    ["leading text", "xGP-PK-7K2M9Q"],
    ["empty", ""],
  ])("rejects %s", (_label, value) => {
    expect(OrderNumberSchema.safeParse(value).success).toBe(false);
  });
});

function createOrderInput(extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    country: "PK",
    design: {
      packagingId: id(1),
      items: [{ itemId: id(101), qty: 2, slot: 0 }],
      wrapperColor: "#ffffff",
      ribbonColor: "#ff0000",
      arrangementSeed: 7,
    },
    contact: { name: "Ayesha", email: "ayesha@example.com", phone: "+92 300 1234567" },
    address: { line1: "12 Garden Road", city: "Karachi" },
    paymentMode: "cod",
    ...extra,
  };
}

describe("CreateOrderRequestSchema: the server owns money", () => {
  it("accepts a valid request", () => {
    expect(CreateOrderRequestSchema.safeParse(createOrderInput()).success).toBe(true);
  });

  it("strips a client-sent price at every level", () => {
    const input = createOrderInput({
      price: 1,
      priceMinor: 1,
      totalMinor: 1,
      quote: { totalMinor: 1, dueNowMinor: 1 },
      shippingMinor: 0,
      discountMinor: 9999,
    });
    const design = input.design as Record<string, unknown>;
    design.priceMinor = 1;
    design.items = [{ itemId: id(101), qty: 2, slot: 0, unitPriceMinor: 1, priceMinor: 1 }];

    const parsed = CreateOrderRequestSchema.parse(input);
    expect(Object.keys(parsed).sort()).toEqual([
      "address",
      "contact",
      "country",
      "design",
      "paymentMode",
    ]);
    expect(Object.keys(parsed.design).sort()).toEqual([
      "arrangementSeed",
      "items",
      "packagingId",
      "personalisation",
      "ribbonColor",
      "wrapperColor",
    ]);
    expect(Object.keys(parsed.design.items[0] ?? {}).sort()).toEqual(["itemId", "qty", "slot"]);
    expect(JSON.stringify(parsed)).not.toMatch(/price|total|quote|discount|shipping/i);
  });

  it("rejects an unknown payment mode and a missing one", () => {
    expect(
      CreateOrderRequestSchema.safeParse(createOrderInput({ paymentMode: "card" })).success,
    ).toBe(false);
    const { paymentMode: _omit, ...rest } = createOrderInput();
    void _omit;
    expect(CreateOrderRequestSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects a bad contact", () => {
    const bad = (contact: Record<string, unknown>) =>
      CreateOrderRequestSchema.safeParse(
        createOrderInput({
          contact: { name: "A", email: "a@b.co", phone: "+1 555 0100", ...contact },
        }),
      ).success;
    expect(bad({ email: "not-an-email" })).toBe(false);
    expect(bad({ phone: "call me" })).toBe(false);
    expect(bad({ name: "   " })).toBe(false);
  });

  it("rejects an address with no street or city", () => {
    expect(
      CreateOrderRequestSchema.safeParse(
        createOrderInput({ address: { line1: "", city: "Karachi" } }),
      ).success,
    ).toBe(false);
    expect(
      CreateOrderRequestSchema.safeParse(
        createOrderInput({ address: { line1: "1 Road", city: " " } }),
      ).success,
    ).toBe(false);
  });

  it("rejects a bad country code", () => {
    expect(CreateOrderRequestSchema.safeParse(createOrderInput({ country: "pk" })).success).toBe(
      false,
    );
  });
});

describe("TrackOrderRequestSchema", () => {
  it("takes an order number plus the phone or email", () => {
    expect(
      TrackOrderRequestSchema.safeParse({ number: "GP-PK-7K2M9Q", contact: "ayesha@example.com" })
        .success,
    ).toBe(true);
    expect(
      TrackOrderRequestSchema.safeParse({ number: "GP-PK-7K2M9Q", contact: "+92300123" }).success,
    ).toBe(true);
  });

  it("rejects a bad number or an empty contact", () => {
    expect(TrackOrderRequestSchema.safeParse({ number: "nope", contact: "a@b.co" }).success).toBe(
      false,
    );
    expect(TrackOrderRequestSchema.safeParse({ number: "GP-PK-7K2M9Q", contact: "" }).success).toBe(
      false,
    );
  });
});

describe("PublicTrackingViewSchema: never shows staff notes or actors", () => {
  const view = {
    number: "GP-PK-7K2M9Q",
    country: "PK",
    status: "shipped",
    paymentStatus: "advance_paid",
    history: [
      { to: "awaiting_payment", at: "2026-10-19T09:00:00.000Z" },
      { to: "shipped", at: "2026-10-20T09:00:00.000Z" },
    ],
    shipment: { courier: "TCS", trackingNumber: "TRK1" },
    createdAt: "2026-10-19T09:00:00.000Z",
  };

  it("accepts the public shape", () => {
    expect(PublicTrackingViewSchema.safeParse(view).success).toBe(true);
    expect(PublicTrackingViewSchema.safeParse({ ...view, shipment: null }).success).toBe(true);
  });

  it("strips actor ids, notes and other private fields", () => {
    const dirty = {
      ...view,
      history: view.history.map((entry) => ({
        ...entry,
        from: "confirmed",
        actorId: id(9),
        note: "Customer is rude, double-check address",
      })),
      contact: { name: "Ayesha", email: "ayesha@example.com", phone: "+92" },
      address: { line1: "12 Garden Road", city: "Karachi" },
      quote: { totalMinor: 1 },
      payments: [],
      staffNotes: "internal",
    };
    const parsed = PublicTrackingViewSchema.parse(dirty);
    expect(Object.keys(parsed).sort()).toEqual([
      "country",
      "createdAt",
      "history",
      "number",
      "paymentStatus",
      "shipment",
      "status",
    ]);
    for (const entry of parsed.history) {
      expect(Object.keys(entry).sort()).toEqual(["at", "to"]);
    }
    expect(JSON.stringify(parsed)).not.toMatch(/actor|note|rude/i);
  });
});
