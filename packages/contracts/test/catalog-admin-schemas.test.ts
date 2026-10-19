import { describe, expect, it } from "vitest";

import {
  CountryParamSchema,
  ItemListQuerySchema,
  SaveItemRequestSchema,
  SavePackagingRequestSchema,
  SetPricesRequestSchema,
} from "../src/index";

const item = {
  name: "Dark bar",
  category: "chocolates",
  shape: "bar",
  color: "#331100",
  sizeUnits: 1,
  personalizable: false,
  active: true,
};

describe("CountryParamSchema", () => {
  it("accepts lower and upper case and normalises to upper case", () => {
    expect(CountryParamSchema.parse("pk")).toBe("PK");
    expect(CountryParamSchema.parse("GB")).toBe("GB");
  });
  it("rejects anything that is not two letters", () => {
    expect(CountryParamSchema.safeParse("pak").success).toBe(false);
    expect(CountryParamSchema.safeParse("1k").success).toBe(false);
  });
});

describe("SetPricesRequestSchema", () => {
  const row = { country: "PK", priceMinor: 120000, inStock: true };
  it("accepts one row per country", () => {
    expect(
      SetPricesRequestSchema.safeParse({ prices: [row, { ...row, country: "US" }] }).success,
    ).toBe(true);
  });
  it("rejects duplicate countries, an empty list and fractional prices", () => {
    expect(SetPricesRequestSchema.safeParse({ prices: [row, row] }).success).toBe(false);
    expect(SetPricesRequestSchema.safeParse({ prices: [] }).success).toBe(false);
    expect(
      SetPricesRequestSchema.safeParse({ prices: [{ ...row, priceMinor: 10.5 }] }).success,
    ).toBe(false);
  });
});

describe("SaveItemRequestSchema", () => {
  it("has no id and needs a name limit for personalizable items", () => {
    expect(SaveItemRequestSchema.safeParse(item).success).toBe(true);
    expect(SaveItemRequestSchema.safeParse({ ...item, personalizable: true }).success).toBe(false);
    expect(
      SaveItemRequestSchema.safeParse({
        ...item,
        personalizable: true,
        personalizationMaxLength: 12,
      }).success,
    ).toBe(true);
  });
});

describe("SavePackagingRequestSchema", () => {
  it("rejects min above max", () => {
    const base = {
      slug: "box",
      name: "Box",
      layoutType: "box-grid",
      minItems: 4,
      maxItems: 9,
      capacityUnits: 12,
      wrapperColors: [{ name: "Pink", hex: "#ffc0cb" }],
      ribbonColors: [{ name: "Red", hex: "#ff0000" }],
      active: true,
    };
    expect(SavePackagingRequestSchema.safeParse(base).success).toBe(true);
    expect(SavePackagingRequestSchema.safeParse({ ...base, minItems: 10 }).success).toBe(false);
  });

  it("reads a missing kind as box and rejects an unknown kind", () => {
    const base = {
      slug: "hat-box",
      name: "Hat box",
      layoutType: "bouquet-fan",
      minItems: 4,
      maxItems: 9,
      capacityUnits: 12,
      wrapperColors: [{ name: "Pink", hex: "#ffc0cb" }],
      ribbonColors: [{ name: "Red", hex: "#ff0000" }],
      active: true,
    };
    expect(SavePackagingRequestSchema.parse(base).kind).toBe("box");
    expect(SavePackagingRequestSchema.parse({ ...base, kind: "basket" }).kind).toBe("basket");
    expect(SavePackagingRequestSchema.safeParse({ ...base, kind: "boat" }).success).toBe(false);
  });
});

describe("ItemListQuerySchema", () => {
  it("coerces paging and the active flag from query strings", () => {
    const parsed = ItemListQuerySchema.parse({ page: "2", active: "true", search: "bar" });
    expect(parsed).toMatchObject({ page: 2, pageSize: 20, active: true, search: "bar" });
  });
});
