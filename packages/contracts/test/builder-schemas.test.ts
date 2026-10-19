import { describe, expect, it } from "vitest";

import {
  DesignInvalidDetailsSchema,
  QuoteRequestSchema,
  QuoteResponseSchema,
  SHARE_ID_LENGTH,
  ShareIdSchema,
} from "../src/index";

const id = "a".repeat(24);
const design = {
  packagingId: id,
  items: [{ itemId: id, qty: 1, slot: 0 }],
  wrapperColor: "#ffffff",
  ribbonColor: "#ff0000",
  arrangementSeed: 7,
};
const quote = {
  currency: "PKR",
  mode: "prepaid",
  goodsMinor: 1000,
  discountMinor: 200,
  shippingMinor: 0,
  totalMinor: 800,
  dueNowMinor: 800,
  dueOnDeliveryMinor: 0,
};

describe("QuoteRequestSchema", () => {
  it("accepts a country and a design and ignores any price a client adds", () => {
    const parsed = QuoteRequestSchema.parse({ country: "PK", design, totalMinor: 1, price: 1 });
    expect(parsed).not.toHaveProperty("totalMinor");
    expect(parsed).not.toHaveProperty("price");
  });
  it("rejects a bad country", () => {
    expect(QuoteRequestSchema.safeParse({ country: "pak", design }).success).toBe(false);
  });
});

describe("QuoteResponseSchema", () => {
  it("needs at least one quote", () => {
    expect(
      QuoteResponseSchema.safeParse({ country: "PK", currency: "PKR", quotes: [] }).success,
    ).toBe(false);
    expect(
      QuoteResponseSchema.safeParse({ country: "PK", currency: "PKR", quotes: [quote] }).success,
    ).toBe(true);
  });
});

describe("DesignInvalidDetailsSchema", () => {
  it("carries typed problems", () => {
    const ok = DesignInvalidDetailsSchema.safeParse({
      problems: [{ code: "TOO_FEW_ITEMS", message: "Pick at least 6 items." }],
    });
    expect(ok.success).toBe(true);
    expect(DesignInvalidDetailsSchema.safeParse({ problems: [] }).success).toBe(false);
  });
});

describe("share ids", () => {
  it("a 10 character url-safe id is valid", () => {
    expect(SHARE_ID_LENGTH).toBe(10);
    expect(ShareIdSchema.safeParse("aB3_-xyz90").success).toBe(true);
    expect(ShareIdSchema.safeParse("short").success).toBe(false);
  });
});
