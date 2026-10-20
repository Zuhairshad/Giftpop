// Pins the length caps on the public partner request form (brand and country requests).
import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createTestApp } from "../../../test/app";
import { clearDatabase, useTestMongo } from "../../../test/mongo";
import { makeCountry } from "../countries/fixtures";
import { CountryModel } from "../countries/model";

import { PartnerRequestModel } from "./model";
import { resetPartnerRateLimit } from "./rate-limit";
import { partnersRouter } from "./router";

useTestMongo();
beforeAll(async () => {
  await PartnerRequestModel.init();
});
beforeEach(async () => {
  await clearDatabase();
  await CountryModel.create([
    makeCountry(),
    makeCountry({ code: "TR", name: "Turkey", currency: "TRY", status: "coming_soon" }),
  ]);
});

const app = createTestApp([{ path: "/partner-requests", router: partnersRouter }]);
const text = (length: number): string => "a".repeat(length);

const contact = {
  contactName: "Ayesha Khan",
  email: "ayesha@example.com",
  phone: "+92 300 1234567",
};
const brand = {
  kind: "brand",
  brandName: "Rose & Co",
  ...contact,
  country: "PK",
  productCategories: ["soap"],
  link: "https://rose.example.com",
};
const countryRequest = {
  kind: "country",
  ...contact,
  country: "TR",
  offering: "We can pack and ship.",
};

const cases: ReadonlyArray<{ name: string; limit: number; body: (v: string) => object }> = [
  { name: "brand.brandName", limit: 120, body: (v) => ({ ...brand, brandName: v }) },
  { name: "brand.contactName", limit: 80, body: (v) => ({ ...brand, contactName: v }) },
  { name: "brand.message", limit: 2000, body: (v) => ({ ...brand, message: v }) },
  { name: "brand.link", limit: 300, body: (v) => ({ ...brand, link: v }) },
  {
    name: "brand.productCategories[]",
    limit: 40,
    body: (v) => ({ ...brand, productCategories: [v] }),
  },
  { name: "country.offering", limit: 1000, body: (v) => ({ ...countryRequest, offering: v }) },
  { name: "country.message", limit: 2000, body: (v) => ({ ...countryRequest, message: v }) },
];

describe("partner request text caps", () => {
  it.each(cases)(
    "$name: accepts $limit characters and rejects one more",
    async ({ limit, body }) => {
      resetPartnerRateLimit();
      const ok = await request(app)
        .post("/v1/partner-requests")
        .send(body(text(limit)));
      expect(ok.status, JSON.stringify(ok.body)).toBeLessThan(300);

      resetPartnerRateLimit();
      const over = await request(app)
        .post("/v1/partner-requests")
        .send(body(text(limit + 1)));
      expect(over.status).toBe(400);
      expect(over.body.error.code).toBe("VALIDATION_ERROR");
    },
    30_000,
  );

  it("rejects more than 20 product categories", async () => {
    resetPartnerRateLimit();
    const res = await request(app)
      .post("/v1/partner-requests")
      .send({ ...brand, productCategories: Array.from({ length: 21 }, (_, i) => `c${i}`) });
    expect(res.status).toBe(400);
  });
});
