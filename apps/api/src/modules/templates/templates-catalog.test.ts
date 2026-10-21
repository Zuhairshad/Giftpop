import {
  FeaturedTemplateSchema,
  PublicTemplateSchema,
  QuoteResponseSchema,
  type Design,
  type Item,
} from "@giftpop/contracts";
import { Types } from "mongoose";
import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { createTestApp } from "../../../test/app";
import { clearDatabase, useTestMongo } from "../../../test/mongo";
import { makeItem, makePackaging } from "../catalog/fixtures";
import { CountryPriceModel } from "../catalog/model";
import { upsertItem, upsertPackaging, upsertPrices } from "../catalog/service";
import { makeCountry } from "../countries/fixtures";
import { CountryModel } from "../countries/model";
import { upsertCountry } from "../countries/service";
import { DesignModel } from "../designs/model";
import { saveDesign } from "../designs/service";
import { initCatalogModels, itemPrice, makeDesign, seedWorld } from "../quotes/fixtures";
import { resetQuoteRateLimit } from "../quotes/rate-limit";
import { quotesRouter } from "../quotes/router";

import { TemplateModel } from "./model";
import { resetStartRateLimit } from "./rate-limit";
import { templatesRouter } from "./router";

vi.mock("../../middleware/require-staff", async () =>
  (await import("../countries/fixtures")).fakeRequireStaffModule(),
);

useTestMongo();
beforeAll(async () => {
  await initCatalogModels();
  await DesignModel.init();
  await TemplateModel.init();
});
beforeEach(async () => {
  await clearDatabase();
  resetStartRateLimit();
  resetQuoteRateLimit();
});

const app = createTestApp([
  { path: "/templates", router: templatesRouter },
  { path: "/quotes", router: quotesRouter },
]);
const STAFF = { "x-test-role": "staff" };
const BIRTHDAY = { slug: "birthday", name: "Birthday" };
const GET_WELL = { slug: "get-well", name: "Get well" };

async function setup(worldOptions: Parameters<typeof seedWorld>[0] = {}) {
  const world = await seedWorld(worldOptions);
  const design = makeDesign(world.packaging, [
    [world.bar, 2],
    [world.soap, 1],
  ]);
  const { shareId } = await saveDesign("PK", design);
  return { world, design, shareId };
}

async function featured(shareId: string, overrides: Record<string, unknown> = {}) {
  const res = await request(app)
    .post("/v1/templates/admin")
    .set(STAFF)
    .send({ title: "Spa day", shareId, countries: ["PK"], ...overrides });
  expect(res.status).toBe(201);
  return FeaturedTemplateSchema.parse(res.body);
}

const list = (query: string) => request(app).get(`/v1/templates?${query}`);
const titles = (res: { body: unknown }) => (res.body as { title: string }[]).map((t) => t.title);
const firstTemplate = async (query = "country=PK") =>
  PublicTemplateSchema.parse(((await list(query)).body as unknown[])[0]);

describe("price of a ready-made gift", () => {
  async function quoteFor(design: Design, country = "PK") {
    const res = await request(app).post("/v1/quotes").send({ country, design });
    expect(res.status).toBe(200);
    return QuoteResponseSchema.parse(res.body);
  }

  it("equals the first quote from POST /quotes for the same design", async () => {
    const { shareId, design } = await setup();
    await featured(shareId);
    const parsed = await firstTemplate();
    const quote = (await quoteFor(design)).quotes[0];
    expect(quote?.mode).toBe("prepaid");
    expect(parsed.priceMinor).toBe(quote?.totalMinor);
    // 90_000 packaging + 2 * 45_000 + 12_000 = 192_000 goods, plus 25_000 flat shipping.
    expect(parsed.priceMinor).toBe(217_000);
  });

  it("uses the country's first payment mode and follows the free-shipping rule", async () => {
    const { shareId, design } = await setup({
      country: {
        paymentModes: ["cod", "prepaid"],
        shipping: { flatMinor: 25_000, freeOverMinor: 150_000, deliveryDays: { min: 3, max: 6 } },
      },
    });
    await featured(shareId);
    const parsed = await firstTemplate();
    const quotes = (await quoteFor(design)).quotes;
    expect(quotes[0]?.mode).toBe("cod");
    expect(quotes[0]?.shippingMinor).toBe(0);
    expect(parsed.priceMinor).toBe(quotes[0]?.totalMinor);
    expect(parsed.priceMinor).toBe(192_000);
  });

  it("prices each country from its own catalog and currency", async () => {
    const { shareId, world, design } = await setup();
    await upsertCountry(makeCountry({ code: "GB", name: "United Kingdom", currency: "GBP" }));
    await upsertPrices([
      {
        kind: "packaging",
        packagingId: world.packaging.id,
        country: "GB",
        priceMinor: 900,
        inStock: true,
      },
      itemPrice(world.bar, "GB", 450),
      itemPrice(world.soap, "GB", 120),
    ]);
    await featured(shareId, { countries: ["PK", "GB"] });
    const gb = await firstTemplate("country=GB");
    expect(gb.currency).toBe("GBP");
    expect(gb.priceMinor).toBe((await quoteFor(design, "GB")).quotes[0]?.totalMinor);
    expect(gb.priceMinor).not.toBe((await firstTemplate()).priceMinor);
  });

  it("follows the catalog price and never reads a price from the client", async () => {
    const { shareId, world } = await setup();
    await featured(shareId);
    const before = await firstTemplate();

    const forged = await list("country=PK&priceMinor=1&price=1&totalMinor=1");
    expect(forged.status).toBe(200);
    expect(PublicTemplateSchema.parse((forged.body as unknown[])[0]).priceMinor).toBe(
      before.priceMinor,
    );
    const withBody = await request(app).get("/v1/templates?country=PK").send({ priceMinor: 1 });
    expect(PublicTemplateSchema.parse((withBody.body as unknown[])[0]).priceMinor).toBe(
      before.priceMinor,
    );

    await upsertPrices([itemPrice(world.bar, "PK", 50_000)]);
    // The bar is in the gift twice: +5_000 each.
    expect((await firstTemplate()).priceMinor).toBe(before.priceMinor + 10_000);
  });

  it("answers 200 and skips a template that cannot be priced", async () => {
    const { shareId } = await setup();
    await featured(shareId, { title: "Good" });
    await CountryModel.updateOne({ code: "PK" }, { paymentModes: [] });
    const res = await list("country=PK");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe("item summary", () => {
  async function bigWorld() {
    const world = await seedWorld();
    const packaging = await upsertPackaging(
      makePackaging({ name: "Hamper", minItems: 2, maxItems: 10, capacityUnits: 30 }),
    );
    const extras: Item[] = [];
    for (const name of ["Tea", "Honey", "Candle", "Biscuits"]) {
      extras.push(await upsertItem(makeItem({ name, sizeUnits: 1 })));
    }
    const all = [world.bar, world.soap, ...extras];
    await upsertPrices([
      {
        kind: "packaging",
        packagingId: packaging.id,
        country: "PK",
        priceMinor: 50_000,
        inStock: true,
      },
      ...all.map((item) => itemPrice(item, "PK", 10_000)),
    ]);
    return { packaging, all };
  }

  it("lists names in design order, caps at 4 and counts the rest", async () => {
    const { packaging, all } = await bigWorld();
    const [bar, soap, tea, honey, candle, biscuits] = all as [Item, Item, Item, Item, Item, Item];
    // Names follow the design's line order, not the catalog's; qty does not repeat a name.
    const design = makeDesign(packaging, [
      [candle, 1],
      [bar, 2],
      [soap, 1],
      [tea, 1],
      [honey, 1],
      [biscuits, 1],
    ]);
    const { shareId } = await saveDesign("PK", design);
    await featured(shareId);
    const parsed = await firstTemplate();
    expect(parsed.itemSummary).toEqual({ names: ["Candle", "Bar", "Soap", "Tea"], moreCount: 2 });
  });

  it("has no more-count at exactly 4 items", async () => {
    const { packaging, all } = await bigWorld();
    const design = makeDesign(
      packaging,
      all.slice(0, 4).map((item) => [item, 1] as const),
    );
    const { shareId } = await saveDesign("PK", design);
    await featured(shareId);
    const parsed = await firstTemplate();
    expect(parsed.itemSummary.names).toHaveLength(4);
    expect(parsed.itemSummary.moreCount).toBe(0);
  });

  it("names the two items of a small gift", async () => {
    const { shareId } = await setup();
    await featured(shareId);
    expect((await firstTemplate()).itemSummary).toEqual({ names: ["Bar", "Soap"], moreCount: 0 });
  });
});

describe("categories, featured and order", () => {
  it("filters by category slug and answers [] for an unknown slug", async () => {
    const { shareId } = await setup();
    await featured(shareId, { title: "Party", category: BIRTHDAY });
    await featured(shareId, { title: "Rest", category: GET_WELL });
    await featured(shareId, { title: "Plain" });

    expect(titles(await list("country=PK"))).toHaveLength(3);
    const birthday = await list("country=PK&category=birthday");
    expect(titles(birthday)).toEqual(["Party"]);
    expect((birthday.body as { category: unknown }[])[0]?.category).toEqual(BIRTHDAY);
    expect(titles(await list("country=pk&category=get-well"))).toEqual(["Rest"]);
    const unknown = await list("country=PK&category=does-not-exist");
    expect(unknown.status).toBe(200);
    expect(unknown.body).toEqual([]);
  });

  it("rejects a malformed category with 400", async () => {
    await setup();
    expect((await list("country=PK&category=Not%20A%20Slug")).status).toBe(400);
  });

  it("keeps the cache header and the sellability rule when filtering", async () => {
    const { shareId, world } = await setup();
    await featured(shareId, { category: BIRTHDAY });
    const res = await list("country=PK&category=birthday");
    expect(res.headers["cache-control"]).toBe("public, max-age=60, stale-while-revalidate=300");
    expect(res.body).toHaveLength(1);
    await CountryPriceModel.deleteOne({ country: "PK", targetId: world.soap.id });
    expect((await list("country=PK&category=birthday")).body).toEqual([]);
  });

  it("drops a template when an item loses its stock or its price in that country", async () => {
    const { shareId, world } = await setup();
    await featured(shareId);
    await upsertPrices([itemPrice(world.bar, "PK", 45_000, false)]);
    expect((await list("country=PK")).body).toEqual([]);
    await upsertPrices([itemPrice(world.bar, "PK", 45_000, true)]);
    expect((await list("country=PK")).body).toHaveLength(1);
    await CountryPriceModel.deleteOne({ country: "PK", targetId: world.soap.id });
    expect((await list("country=PK")).body).toEqual([]);
  });

  it("puts featured first, then sortOrder, then title", async () => {
    const { shareId } = await setup();
    await featured(shareId, { title: "B plain", sortOrder: 0 });
    await featured(shareId, { title: "A plain", sortOrder: 0 });
    await featured(shareId, { title: "Z star", sortOrder: 9, featured: true });
    await featured(shareId, { title: "M star", sortOrder: 1, featured: true });
    await featured(shareId, { title: "C late", sortOrder: 2 });
    expect(titles(await list("country=PK"))).toEqual([
      "M star",
      "Z star",
      "A plain",
      "B plain",
      "C late",
    ]);
  });

  it("reads a template saved before categories existed as no category and not featured", async () => {
    const { shareId } = await setup();
    const old = await featured(shareId, { title: "Old", sortOrder: 0 });
    await featured(shareId, { title: "New star", sortOrder: 5, featured: true });
    await TemplateModel.collection.updateOne(
      { _id: new Types.ObjectId(old.id) },
      { $unset: { category: "", featured: "" } },
    );

    const res = await list("country=PK");
    const parsed = (res.body as unknown[]).map((x) => PublicTemplateSchema.parse(x));
    expect(parsed.map((x) => x.title)).toEqual(["New star", "Old"]);
    expect(parsed[1]).toMatchObject({ category: null, featured: false });
    expect(titles(await list("country=PK&category=birthday"))).toEqual([]);

    const staff = await request(app).get("/v1/templates/admin").set(STAFF);
    const read = (staff.body as { id: string }[]).find((x) => x.id === old.id);
    expect(FeaturedTemplateSchema.parse(read)).toMatchObject({ category: null, featured: false });
  });
});

describe("staff create and update with category and featured", () => {
  const patch = (id: string, body: object) =>
    request(app).patch(`/v1/templates/admin/${id}`).set(STAFF).send(body);

  it("round-trips category and featured on create, and defaults them", async () => {
    const { shareId } = await setup();
    const t = await featured(shareId, { category: BIRTHDAY, featured: true });
    expect(t).toMatchObject({ category: BIRTHDAY, featured: true });
    const stored = await TemplateModel.findById(t.id).lean();
    expect(stored?.category).toEqual(BIRTHDAY);
    expect(stored?.featured).toBe(true);

    const plain = await featured(shareId, { title: "Plain" });
    expect(plain).toMatchObject({ category: null, featured: false });
  });

  it("normalises the category slug and rejects a bad one with 400", async () => {
    const { shareId } = await setup();
    const t = await featured(shareId, { category: { slug: " Thank-You ", name: "Thank you" } });
    expect(t.category).toEqual({ slug: "thank-you", name: "Thank you" });
    const bad = await request(app)
      .post("/v1/templates/admin")
      .set(STAFF)
      .send({ title: "x", shareId, countries: ["PK"], category: { slug: "no spaces", name: "x" } });
    expect(bad.status).toBe(400);
  });

  it("updates them, leaves them alone when omitted, and clears the category with null", async () => {
    const { shareId } = await setup();
    const t = await featured(shareId, { category: BIRTHDAY, featured: true });

    const renamed = await patch(t.id, { title: "Renamed" });
    expect(renamed.status).toBe(200);
    expect(renamed.body).toMatchObject({ title: "Renamed", category: BIRTHDAY, featured: true });

    const changed = await patch(t.id, { category: GET_WELL, featured: false });
    expect(changed.body).toMatchObject({ category: GET_WELL, featured: false });

    const cleared = await patch(t.id, { category: null });
    expect(cleared.body).toMatchObject({ category: null, featured: false });
    expect((await TemplateModel.findById(t.id).lean())?.category).toBeNull();
    expect(titles(await list("country=PK&category=get-well"))).toEqual([]);
  });

  it("answers 401 to anonymous callers when creating or updating", async () => {
    const { shareId } = await setup();
    const body = { title: "x", shareId, countries: ["PK"], featured: true };
    expect((await request(app).post("/v1/templates/admin").send(body)).status).toBe(401);
    const id = "a".repeat(24);
    const res = await request(app).patch(`/v1/templates/admin/${id}`).send({ featured: true });
    expect(res.status).toBe(401);
  });
});
