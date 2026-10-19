import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  CountryCodeSchema,
  CountrySchema,
  LAUNCH_COUNTRY_CODES,
  LaunchCountryCodeSchema,
  PaginationQuerySchema,
  UpdateCountryRequestSchema,
  paginatedSchema,
} from "../src/index";

describe("country codes", () => {
  it("the launch list is the nine countries in docs/product.md", () => {
    expect([...LAUNCH_COUNTRY_CODES].sort()).toEqual(
      ["AU", "CA", "CN", "GB", "IN", "PK", "SA", "TR", "US"].sort(),
    );
    expect(LAUNCH_COUNTRY_CODES).toHaveLength(9);
  });

  it("LaunchCountryCodeSchema accepts only the nine", () => {
    for (const code of LAUNCH_COUNTRY_CODES) {
      expect(LaunchCountryCodeSchema.safeParse(code).success).toBe(true);
    }
    for (const code of ["FR", "DE", "pk", "PAK", ""]) {
      expect(LaunchCountryCodeSchema.safeParse(code).success).toBe(false);
    }
  });

  it("CountryCodeSchema is the general ISO alpha-2 shape, so new countries need no code change", () => {
    for (const code of ["PK", "US", "FR", "DE", "AE", "NZ"]) {
      expect(CountryCodeSchema.safeParse(code).success).toBe(true);
    }
    for (const code of ["pk", "Pk", "PAK", "P", "", "1A", "P1", " PK", "PK "]) {
      expect(CountryCodeSchema.safeParse(code).success).toBe(false);
    }
  });
});

const country = {
  code: "PK",
  name: "Pakistan",
  currency: "PKR",
  status: "live",
  paymentModes: ["prepaid", "cod"],
  shipping: { flatMinor: 25000, freeOverMinor: 500000, deliveryDays: { min: 3, max: 6 } },
  addressFormat: {
    region: { required: true, label: "Province" },
    postalCode: { required: false, label: "Postcode" },
  },
  paymentInstructions: "Send to account 1234",
};

describe("CountrySchema", () => {
  it("accepts a country document, with or without a free-shipping threshold", () => {
    expect(CountrySchema.safeParse(country).success).toBe(true);
    const { freeOverMinor: _omit, ...shipping } = country.shipping;
    void _omit;
    expect(CountrySchema.safeParse({ ...country, shipping }).success).toBe(true);
  });

  it("accepts coming_soon and rejects other statuses", () => {
    expect(CountrySchema.safeParse({ ...country, status: "coming_soon" }).success).toBe(true);
    expect(CountrySchema.safeParse({ ...country, status: "beta" }).success).toBe(false);
  });

  it("allows any subset of payment modes the admin switches on, and rejects unknown ones", () => {
    expect(CountrySchema.safeParse({ ...country, paymentModes: ["cod"] }).success).toBe(true);
    expect(CountrySchema.safeParse({ ...country, paymentModes: [] }).success).toBe(true);
    expect(CountrySchema.safeParse({ ...country, paymentModes: ["card"] }).success).toBe(false);
  });

  it("keeps shipping in integer, non-negative minor units", () => {
    const withShipping = (shipping: Record<string, unknown>) =>
      CountrySchema.safeParse({ ...country, shipping: { ...country.shipping, ...shipping } })
        .success;
    expect(withShipping({ flatMinor: 0 })).toBe(true);
    expect(withShipping({ flatMinor: -1 })).toBe(false);
    expect(withShipping({ flatMinor: 10.5 })).toBe(false);
    expect(withShipping({ freeOverMinor: -1 })).toBe(false);
    expect(withShipping({ freeOverMinor: 99.5 })).toBe(false);
  });

  it("rejects delivery days where min exceeds max", () => {
    const days = (min: number, max: number) =>
      CountrySchema.safeParse({
        ...country,
        shipping: { ...country.shipping, deliveryDays: { min, max } },
      }).success;
    expect(days(3, 3)).toBe(true);
    expect(days(0, 2)).toBe(true);
    expect(days(4, 3)).toBe(false);
    expect(days(-1, 3)).toBe(false);
  });

  it("rejects a bad currency or country code", () => {
    expect(CountrySchema.safeParse({ ...country, currency: "pkr" }).success).toBe(false);
    expect(CountrySchema.safeParse({ ...country, code: "pk" }).success).toBe(false);
  });

  it("UpdateCountryRequestSchema is a partial that never changes the code", () => {
    expect(UpdateCountryRequestSchema.safeParse({}).success).toBe(true);
    expect(UpdateCountryRequestSchema.safeParse({ status: "coming_soon" }).success).toBe(true);
    expect(UpdateCountryRequestSchema.parse({ status: "live", code: "FR" })).toEqual({
      status: "live",
    });
    expect(UpdateCountryRequestSchema.safeParse({ currency: "xx" }).success).toBe(false);
  });
});

describe("PaginationQuerySchema", () => {
  it("defaults to page 1 with 20 per page", () => {
    expect(PaginationQuerySchema.parse({})).toEqual({ page: 1, pageSize: 20 });
  });

  it("coerces query-string values", () => {
    expect(PaginationQuerySchema.parse({ page: "3", pageSize: "50" })).toEqual({
      page: 3,
      pageSize: 50,
    });
  });

  it("accepts the bounds: page 1, pageSize 1 and 100", () => {
    expect(PaginationQuerySchema.safeParse({ page: 1, pageSize: 1 }).success).toBe(true);
    expect(PaginationQuerySchema.safeParse({ pageSize: 100 }).success).toBe(true);
  });

  it.each([
    { page: 0 },
    { page: -1 },
    { page: 1.5 },
    { page: "abc" },
    { pageSize: 0 },
    { pageSize: 101 },
    { pageSize: "x" },
  ])("rejects %j", (query) => {
    expect(PaginationQuerySchema.safeParse(query).success).toBe(false);
  });

  it("paginatedSchema wraps items with page info", () => {
    const schema = paginatedSchema(z.string());
    expect(schema.safeParse({ items: ["a"], page: 1, pageSize: 20, total: 1 }).success).toBe(true);
    expect(schema.safeParse({ items: [1], page: 1, pageSize: 20, total: 1 }).success).toBe(false);
    expect(schema.safeParse({ items: [], page: 0, pageSize: 20, total: 0 }).success).toBe(false);
  });
});
