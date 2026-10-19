import {
  DesignInvalidDetailsSchema,
  QuoteResponseSchema,
  type DesignProblemCode,
} from "@giftpop/contracts";
import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createTestApp } from "../../../test/app";
import { clearDatabase, useTestMongo } from "../../../test/mongo";
import { makeItem } from "../catalog/fixtures";
import { upsertItem, upsertPrices } from "../catalog/service";
import { makeCountry } from "../countries/fixtures";
import { upsertCountry } from "../countries/service";

import { initCatalogModels, itemPrice, makeDesign, seedWorld } from "./fixtures";
import { createIpLimiter, resetQuoteRateLimit } from "./rate-limit";
import { createQuotesRouter, quotesRouter } from "./router";

useTestMongo();
beforeAll(initCatalogModels);
beforeEach(async () => {
  await clearDatabase();
  resetQuoteRateLimit();
});

const app = createTestApp([{ path: "/quotes", router: quotesRouter }]);
const post = (body: unknown) =>
  request(app)
    .post("/v1/quotes")
    .send(body as object);

describe("POST /v1/quotes: pricing", () => {
  it("prices a PK-style country in both modes with hand-computed numbers", async () => {
    // goods = 90_000 box + 2 x 45_000 bars + 12_000 soap = 192_000; flat shipping 25_000
    const { packaging, bar, soap } = await seedWorld();

    const res = await post({
      country: "PK",
      design: makeDesign(packaging, [
        [bar, 2],
        [soap, 1],
      ]),
    });

    expect(res.status).toBe(200);
    const body = QuoteResponseSchema.parse(res.body);
    expect(body.country).toBe("PK");
    expect(body.currency).toBe("PKR");
    expect(body.quotes).toEqual([
      {
        // prepaid: 20% off goods only: 38_400 off, shipping untouched
        currency: "PKR",
        mode: "prepaid",
        goodsMinor: 192_000,
        discountMinor: 38_400,
        shippingMinor: 25_000,
        totalMinor: 178_600,
        dueNowMinor: 178_600,
        dueOnDeliveryMinor: 0,
      },
      {
        // cod: total 217_000, 20% of the total now
        currency: "PKR",
        mode: "cod",
        goodsMinor: 192_000,
        discountMinor: 0,
        shippingMinor: 25_000,
        totalMinor: 217_000,
        dueNowMinor: 43_400,
        dueOnDeliveryMinor: 173_600,
      },
    ]);
  });

  it("prices a US-style country (cents, flat shipping, half-up rounding) in the country's mode order", async () => {
    // goods = 1_999 + 2 x 499 = 2_997; shipping 599
    const { packaging, bar } = await seedWorld({
      country: {
        code: "US",
        name: "United States",
        currency: "USD",
        paymentModes: ["cod", "prepaid"],
        shipping: { flatMinor: 599, deliveryDays: { min: 3, max: 5 } },
      },
      packagingPriceMinor: 1_999,
      barPriceMinor: 499,
    });

    const res = await post({ country: "US", design: makeDesign(packaging, [[bar, 2]]) });

    expect(res.status).toBe(200);
    const body = QuoteResponseSchema.parse(res.body);
    expect(body.currency).toBe("USD");
    expect(body.quotes).toEqual([
      {
        // cod: total 3_596; 20% = 719.2 -> 719 now
        currency: "USD",
        mode: "cod",
        goodsMinor: 2_997,
        discountMinor: 0,
        shippingMinor: 599,
        totalMinor: 3_596,
        dueNowMinor: 719,
        dueOnDeliveryMinor: 2_877,
      },
      {
        // prepaid: 20% of 2_997 = 599.4 -> 599 off
        currency: "USD",
        mode: "prepaid",
        goodsMinor: 2_997,
        discountMinor: 599,
        shippingMinor: 599,
        totalMinor: 2_997,
        dueNowMinor: 2_997,
        dueOnDeliveryMinor: 0,
      },
    ]);
  });

  it("returns only the modes the country accepts", async () => {
    const { packaging, bar } = await seedWorld({ country: { paymentModes: ["prepaid"] } });

    const res = await post({ country: "PK", design: makeDesign(packaging, [[bar, 2]]) });

    expect(res.status).toBe(200);
    expect(res.body.quotes.map((q: { mode: string }) => q.mode)).toEqual(["prepaid"]);
  });

  it("makes shipping free when goods reach the free-over amount, and not one unit sooner", async () => {
    // goods = 90_000 + 4 x 45_000 = 270_000
    const free = await seedWorld({
      country: {
        shipping: { flatMinor: 25_000, freeOverMinor: 270_000, deliveryDays: { min: 3, max: 6 } },
      },
    });
    const design = makeDesign(free.packaging, [[free.bar, 4]]);

    const atThreshold = await post({ country: "PK", design });
    expect(atThreshold.body.quotes).toMatchObject([
      { mode: "prepaid", shippingMinor: 0, discountMinor: 54_000, totalMinor: 216_000 },
      {
        mode: "cod",
        shippingMinor: 0,
        totalMinor: 270_000,
        dueNowMinor: 54_000,
        dueOnDeliveryMinor: 216_000,
      },
    ]);

    await upsertCountry(
      makeCountry({
        shipping: { flatMinor: 25_000, freeOverMinor: 270_001, deliveryDays: { min: 3, max: 6 } },
      }),
    );
    const justBelow = await post({ country: "PK", design });
    expect(justBelow.body.quotes).toMatchObject([
      { mode: "prepaid", shippingMinor: 25_000, discountMinor: 54_000, totalMinor: 241_000 },
      {
        mode: "cod",
        shippingMinor: 25_000,
        totalMinor: 295_000,
        dueNowMinor: 59_000,
        dueOnDeliveryMinor: 236_000,
      },
    ]);
  });

  it("ignores every price the client sends and uses database prices", async () => {
    const { packaging, bar, soap } = await seedWorld();
    const design = makeDesign(packaging, [
      [bar, 2],
      [soap, 1],
    ]);
    const clean = await post({ country: "PK", design });

    const tampered = await post({
      country: "PK",
      totalMinor: 1,
      priceMinor: 1,
      quotes: [{ totalMinor: 1 }],
      design: {
        ...design,
        totalMinor: 1,
        priceMinor: 1,
        packagingPriceMinor: 1,
        items: design.items.map((line) => ({
          ...line,
          priceMinor: 1,
          unitPriceMinor: 1,
          totalMinor: 1,
        })),
      },
    });

    expect(tampered.status).toBe(200);
    expect(tampered.body).toEqual(clean.body);
    expect(tampered.body.quotes[0].totalMinor).toBe(178_600);
  });

  it("uses the price at quote time, so a catalog price change moves the quote", async () => {
    const { packaging, bar } = await seedWorld();
    const design = makeDesign(packaging, [[bar, 2]]);
    const before = await post({ country: "PK", design });

    await upsertPrices([itemPrice(bar, "PK", 50_000)]);
    const after = await post({ country: "PK", design });

    expect(after.body.quotes[0].goodsMinor - before.body.quotes[0].goodsMinor).toBe(10_000);
  });
});

describe("POST /v1/quotes: rejections", () => {
  it("returns 404 for an unknown country", async () => {
    const { packaging, bar } = await seedWorld();
    const res = await post({ country: "ZZ", design: makeDesign(packaging, [[bar, 2]]) });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("returns 422 for a country that is not live yet", async () => {
    const { packaging, bar } = await seedWorld();
    await upsertCountry(makeCountry({ code: "TR", currency: "TRY", status: "coming_soon" }));
    const res = await post({ country: "TR", design: makeDesign(packaging, [[bar, 2]]) });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when the body does not match the contract", async () => {
    const { packaging, bar } = await seedWorld();
    const design = makeDesign(packaging, [[bar, 2]]);
    const cases: unknown[] = [
      {},
      { country: "PK" },
      { design },
      { country: "pakistan", design },
      { country: "PK", design: { ...design, packagingId: "nope" } },
      { country: "PK", design: { ...design, items: [{ itemId: bar.id, qty: 0, slot: 0 }] } },
      {
        country: "PK",
        design: {
          ...design,
          items: [
            { itemId: bar.id, qty: 1, slot: 0 },
            { itemId: bar.id, qty: 1, slot: 0 },
          ],
        },
      },
    ];
    for (const body of cases) {
      const res = await post(body);
      expect(res.status, JSON.stringify(body)).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    }
  });

  it("returns 429 RATE_LIMITED once the limit is spent", async () => {
    const { packaging, bar } = await seedWorld();
    const limited = createTestApp([
      { path: "/quotes", router: createQuotesRouter({ limiter: createIpLimiter({ limit: 2 }) }) },
    ]);
    const body = { country: "PK", design: makeDesign(packaging, [[bar, 2]]) };

    expect((await request(limited).post("/v1/quotes").send(body)).status).toBe(200);
    expect((await request(limited).post("/v1/quotes").send(body)).status).toBe(200);
    const res = await request(limited).post("/v1/quotes").send(body);

    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe("RATE_LIMITED");
  });
});

describe("POST /v1/quotes: design problems reach the 422 response", () => {
  async function problemsFor(
    design: Parameters<typeof post>[0],
  ): Promise<{ status: number; codes: DesignProblemCode[]; body: unknown }> {
    const res = await post(design);
    const details = DesignInvalidDetailsSchema.safeParse(res.body?.error?.details);
    return {
      status: res.status,
      codes: details.success ? details.data.problems.map((p) => p.code) : [],
      body: res.body,
    };
  }

  it("reports TOO_FEW_ITEMS", async () => {
    const { packaging, bar } = await seedWorld();
    const r = await problemsFor({ country: "PK", design: makeDesign(packaging, [[bar, 1]]) });
    expect(r.status).toBe(422);
    expect(r.body).toMatchObject({ error: { code: "DESIGN_INVALID" } });
    expect(r.codes).toEqual(["TOO_FEW_ITEMS"]);
  });

  it("reports TOO_MANY_ITEMS", async () => {
    const { packaging, bar } = await seedWorld();
    const r = await problemsFor({ country: "PK", design: makeDesign(packaging, [[bar, 5]]) });
    expect(r.status).toBe(422);
    expect(r.codes).toEqual(["TOO_MANY_ITEMS"]);
  });

  it("reports OVER_CAPACITY", async () => {
    const { packaging } = await seedWorld();
    const big = await upsertItem(makeItem({ name: "Hamper", sizeUnits: 5 }));
    await upsertPrices([itemPrice(big, "PK", 1_000)]);
    const r = await problemsFor({ country: "PK", design: makeDesign(packaging, [[big, 2]]) });
    expect(r.status).toBe(422);
    expect(r.codes).toEqual(["OVER_CAPACITY"]);
  });

  it("reports ITEM_UNAVAILABLE for an item with no price in the country", async () => {
    const { packaging, bar } = await seedWorld();
    const unpriced = await upsertItem(makeItem({ name: "Unpriced" }));
    const r = await problemsFor({
      country: "PK",
      design: makeDesign(packaging, [
        [bar, 1],
        [unpriced, 1],
      ]),
    });
    expect(r.status).toBe(422);
    expect(r.codes).toEqual(["ITEM_UNAVAILABLE"]);
  });

  it("reports ITEM_UNAVAILABLE for an inactive item", async () => {
    const { packaging, bar } = await seedWorld();
    const off = await upsertItem(makeItem({ name: "Retired", active: false }));
    await upsertPrices([itemPrice(off, "PK", 1_000)]);
    const r = await problemsFor({
      country: "PK",
      design: makeDesign(packaging, [
        [bar, 1],
        [off, 1],
      ]),
    });
    expect(r.codes).toEqual(["ITEM_UNAVAILABLE"]);
  });

  it("reports OUT_OF_STOCK", async () => {
    const { packaging, bar } = await seedWorld();
    const sold = await upsertItem(makeItem({ name: "Sold out" }));
    await upsertPrices([itemPrice(sold, "PK", 1_000, false)]);
    const r = await problemsFor({
      country: "PK",
      design: makeDesign(packaging, [
        [bar, 1],
        [sold, 1],
      ]),
    });
    expect(r.status).toBe(422);
    expect(r.codes).toEqual(["OUT_OF_STOCK"]);
  });

  it("reports TEXT_TOO_LONG for a name on a non-personalizable item", async () => {
    const { packaging, bar } = await seedWorld();
    const design = makeDesign(packaging, [[bar, 2]]);
    design.personalisation.itemNames = { [bar.id]: "Sara" };
    const r = await problemsFor({ country: "PK", design });
    expect(r.status).toBe(422);
    expect(r.codes).toEqual(["TEXT_TOO_LONG"]);
  });

  it("reports TEXT_TOO_LONG for a name over the item's own limit", async () => {
    const { packaging, bar } = await seedWorld();
    const mug = await upsertItem(
      makeItem({ name: "Mug", shape: "mug", personalizable: true, personalizationMaxLength: 5 }),
    );
    await upsertPrices([itemPrice(mug, "PK", 1_000)]);
    const design = makeDesign(packaging, [
      [bar, 1],
      [mug, 1],
    ]);
    design.personalisation.itemNames = { [mug.id]: "Sarahh" };
    const r = await problemsFor({ country: "PK", design });
    expect(r.codes).toEqual(["TEXT_TOO_LONG"]);

    design.personalisation.itemNames = { [mug.id]: "Sarah" };
    expect((await post({ country: "PK", design })).status).toBe(200);
  });

  it("reports PACKAGING_UNAVAILABLE when the packaging has no price in the country", async () => {
    const { bar } = await seedWorld();
    const { packaging: other } = await seedWorld({
      country: { code: "US", name: "United States", currency: "USD" },
    });
    // `other` is priced in US only: unavailable in PK.
    const r = await problemsFor({ country: "PK", design: makeDesign(other, [[bar, 2]]) });
    expect(r.status).toBe(422);
    expect(r.codes).toEqual(["PACKAGING_UNAVAILABLE"]);
  });

  it("lists every problem at once", async () => {
    const { packaging } = await seedWorld();
    const sold = await upsertItem(makeItem({ name: "Sold out" }));
    await upsertPrices([itemPrice(sold, "PK", 1_000, false)]);
    const r = await problemsFor({
      country: "PK",
      design: makeDesign(packaging, [[sold, 1]]),
    });
    expect(r.codes.sort()).toEqual(["OUT_OF_STOCK", "TOO_FEW_ITEMS"]);
  });
});
