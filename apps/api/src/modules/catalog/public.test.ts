import {
  CatalogResponseSchema,
  type CountryPrice,
  type Item,
  type Packaging,
} from "@giftpop/contracts";
import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createTestApp } from "../../../test/app";
import { clearDatabase, useTestMongo } from "../../../test/mongo";
import { makeCountry } from "../countries/fixtures";
import { upsertCountry } from "../countries/service";

import { initCatalogModels, makeItem, makePackaging } from "./fixtures";
import { catalogRouter } from "./router";
import { upsertItem, upsertPackaging, upsertPrices } from "./service";

useTestMongo();
beforeAll(initCatalogModels);
beforeEach(clearDatabase);

const app = createTestApp([{ path: "/catalog", router: catalogRouter }]);

function itemPrice(item: Item, country: string, priceMinor = 1000, inStock = true): CountryPrice {
  return { kind: "item", itemId: item.id, country, priceMinor, inStock };
}
function packagingPrice(p: Packaging, country: string, priceMinor = 5000): CountryPrice {
  return { kind: "packaging", packagingId: p.id, country, priceMinor, inStock: true };
}

describe("GET /v1/catalog", () => {
  it("returns 404 for an unknown country", async () => {
    const res = await request(app).get("/v1/catalog?country=zz");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
    expect(res.headers["cache-control"]).toBeUndefined();
  });

  it("returns 400 when country is missing or malformed", async () => {
    expect((await request(app).get("/v1/catalog")).status).toBe(400);
    expect((await request(app).get("/v1/catalog?country=pakistan")).status).toBe(400);
  });

  it("returns status without a catalog for a coming-soon country, even if prices exist", async () => {
    await upsertCountry(makeCountry({ code: "TR", currency: "TRY", status: "coming_soon" }));
    const item = await upsertItem(makeItem());
    await upsertPrices([itemPrice(item, "TR")]);

    const res = await request(app).get("/v1/catalog?country=TR");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      country: "TR",
      currency: "TRY",
      status: "coming_soon",
      packagings: [],
      items: [],
      categories: [],
    });
    expect(res.headers["cache-control"]).toBe("public, max-age=60, stale-while-revalidate=300");
  });

  it("returns priced items and packagings with stock, categories and currency, matching the contract", async () => {
    await upsertCountry(makeCountry());
    const bar = await upsertItem(makeItem({ name: "Bar", category: "chocolates" }));
    const rose = await upsertItem(makeItem({ name: "Rose", category: "flowers", shape: "flower" }));
    const soap = await upsertItem(makeItem({ name: "Soap", category: "care" }));
    const box = await upsertPackaging(makePackaging({ name: "Box", layoutType: "box-grid" }));
    await upsertPrices([
      itemPrice(bar, "PK", 45_000),
      itemPrice(rose, "PK", 30_000, false),
      itemPrice(soap, "PK", 12_000),
      packagingPrice(box, "PK", 90_000),
    ]);

    const res = await request(app).get("/v1/catalog?country=pk");

    expect(res.status).toBe(200);
    expect(res.headers["cache-control"]).toBe("public, max-age=60, stale-while-revalidate=300");
    const body = CatalogResponseSchema.parse(res.body);
    expect(body.country).toBe("PK");
    expect(body.currency).toBe("PKR");
    expect(body.status).toBe("live");
    expect(body.categories).toEqual(["care", "chocolates", "flowers"]);
    expect(body.items.map((entry) => entry.item.name)).toEqual(["Bar", "Rose", "Soap"]);
    expect(body.items.find((entry) => entry.item.name === "Bar")).toMatchObject({
      priceMinor: 45_000,
      inStock: true,
    });
    expect(body.items.find((entry) => entry.item.name === "Rose")?.inStock).toBe(false);
    expect(body.packagings).toHaveLength(1);
    expect(body.packagings[0]).toMatchObject({ priceMinor: 90_000, packaging: { id: box.id } });
    expect(JSON.stringify(res.body)).not.toContain("_id");
    expect(JSON.stringify(res.body)).not.toContain("__v");
  });

  it("excludes an item with no price row in that country", async () => {
    await upsertCountry(makeCountry());
    await upsertCountry(makeCountry({ code: "GB", name: "United Kingdom", currency: "GBP" }));
    const priced = await upsertItem(makeItem({ name: "Priced" }));
    const unpriced = await upsertItem(makeItem({ name: "Unpriced" }));
    const ukOnly = await upsertItem(makeItem({ name: "UK only" }));
    await upsertPrices([itemPrice(priced, "PK"), itemPrice(ukOnly, "GB")]);

    const pk = await request(app).get("/v1/catalog?country=PK");
    expect(pk.body.items.map((entry: { item: Item }) => entry.item.id)).toEqual([priced.id]);
    expect(pk.body.items.map((entry: { item: Item }) => entry.item.id)).not.toContain(unpriced.id);

    const gb = await request(app).get("/v1/catalog?country=GB");
    expect(gb.body.currency).toBe("GBP");
    expect(gb.body.items.map((entry: { item: Item }) => entry.item.id)).toEqual([ukOnly.id]);
  });

  it("excludes inactive items and inactive packagings, and drops categories they leave empty", async () => {
    await upsertCountry(makeCountry());
    const live = await upsertItem(makeItem({ name: "Live", category: "chocolates" }));
    const hidden = await upsertItem(makeItem({ name: "Hidden", category: "cards", active: false }));
    const activeBox = await upsertPackaging(makePackaging({ name: "Active box" }));
    const hiddenBox = await upsertPackaging(makePackaging({ name: "Hidden box", active: false }));
    await upsertPrices([
      itemPrice(live, "PK"),
      itemPrice(hidden, "PK"),
      packagingPrice(activeBox, "PK"),
      packagingPrice(hiddenBox, "PK"),
    ]);

    const res = await request(app).get("/v1/catalog?country=PK");

    expect(res.body.items.map((entry: { item: Item }) => entry.item.name)).toEqual(["Live"]);
    expect(
      res.body.packagings.map((entry: { packaging: Packaging }) => entry.packaging.name),
    ).toEqual(["Active box"]);
    expect(res.body.categories).toEqual(["chocolates"]);
  });

  it("keeps optional fields and defaults: personalisation limit, image, layers", async () => {
    await upsertCountry(makeCountry());
    const image = {
      url: "https://cdn.test/a.webp",
      width: 400,
      height: 600,
      anchor: { x: 0.5, y: 1 },
    };
    const mug = await upsertItem(
      makeItem({
        name: "Mug",
        shape: "mug",
        personalizable: true,
        personalizationMaxLength: 12,
        image,
      }),
    );
    const box = await upsertPackaging(makePackaging({ layers: { back: image } }));
    await upsertPrices([itemPrice(mug, "PK"), packagingPrice(box, "PK")]);

    const res = await request(app).get("/v1/catalog?country=PK");

    expect(res.body.items[0].item).toMatchObject({ personalizationMaxLength: 12, image });
    expect(res.body.packagings[0].packaging.layers).toEqual({ back: image });
  });

  it("serves a live country with no priced products as empty lists", async () => {
    await upsertCountry(makeCountry());
    const res = await request(app).get("/v1/catalog?country=PK");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: "live", packagings: [], items: [], categories: [] });
  });
});
