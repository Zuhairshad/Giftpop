import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { createTestApp } from "../../../test/app";
import { clearDatabase, useTestMongo } from "../../../test/mongo";
import { makeCountry } from "../countries/fixtures";
import { upsertCountry } from "../countries/service";

import { initCatalogModels, itemBody, makeItem, makePackaging } from "./fixtures";
import { CountryPriceModel } from "./model";
import { catalogRouter } from "./router";
import { upsertItem, upsertPackaging, upsertPrices } from "./service";

vi.mock("../../middleware/require-staff", async () =>
  (await import("../countries/fixtures")).fakeRequireStaffModule(),
);

useTestMongo();
beforeAll(initCatalogModels);
beforeEach(clearDatabase);

const app = createTestApp([{ path: "/catalog", router: catalogRouter }]);
const staff = { "x-test-role": "staff" };

describe("admin prices", () => {
  beforeEach(async () => {
    await upsertCountry(makeCountry());
    await upsertCountry(makeCountry({ code: "GB", name: "United Kingdom", currency: "GBP" }));
    await upsertCountry(makeCountry({ code: "IN", name: "India", currency: "INR" }));
  });

  it("bulk upserts one item's prices across countries and leaves other countries alone", async () => {
    const item = await upsertItem(makeItem());
    await upsertPrices([
      { kind: "item", itemId: item.id, country: "IN", priceMinor: 500, inStock: true },
    ]);
    const put = (prices: unknown) =>
      request(app).put(`/v1/catalog/admin/items/${item.id}/prices`).set(staff).send({ prices });

    const first = await put([
      { country: "PK", priceMinor: 45_000, inStock: true },
      { country: "GB", priceMinor: 350, inStock: false },
    ]);
    expect(first.status).toBe(200);
    expect(first.body.prices).toEqual([
      { country: "GB", priceMinor: 350, inStock: false },
      { country: "IN", priceMinor: 500, inStock: true },
      { country: "PK", priceMinor: 45_000, inStock: true },
    ]);

    // Same call again with a changed price updates rather than duplicating.
    const second = await put([{ country: "PK", priceMinor: 47_000, inStock: false }]);
    expect(second.body.prices).toHaveLength(3);
    expect(second.body.prices.find((p: { country: string }) => p.country === "PK")).toEqual({
      country: "PK",
      priceMinor: 47_000,
      inStock: false,
    });
    expect(await CountryPriceModel.countDocuments()).toBe(3);

    const read = await request(app).get(`/v1/catalog/admin/items/${item.id}/prices`).set(staff);
    expect(read.body).toEqual(second.body);
  });

  it("keeps prices of different items apart", async () => {
    const a = await upsertItem(makeItem({ name: "A" }));
    const b = await upsertItem(makeItem({ name: "B" }));
    await request(app)
      .put(`/v1/catalog/admin/items/${a.id}/prices`)
      .set(staff)
      .send({ prices: [{ country: "PK", priceMinor: 1, inStock: true }] });
    const res = await request(app).get(`/v1/catalog/admin/items/${b.id}/prices`).set(staff);
    expect(res.body).toEqual({ prices: [] });
  });

  it("rejects a country that does not exist with 422 and saves nothing", async () => {
    const item = await upsertItem(makeItem());
    const res = await request(app)
      .put(`/v1/catalog/admin/items/${item.id}/prices`)
      .set(staff)
      .send({
        prices: [
          { country: "PK", priceMinor: 100, inStock: true },
          { country: "ZZ", priceMinor: 100, inStock: true },
        ],
      });
    expect(res.status).toBe(422);
    expect(res.body.error.details).toEqual({ countries: ["ZZ"] });
    expect(await CountryPriceModel.countDocuments()).toBe(0);
  });

  it("rejects float, negative, duplicate-country and empty price bodies with 400", async () => {
    const item = await upsertItem(makeItem());
    const put = (prices: unknown) =>
      request(app).put(`/v1/catalog/admin/items/${item.id}/prices`).set(staff).send({ prices });
    expect((await put([{ country: "PK", priceMinor: 10.5, inStock: true }])).status).toBe(400);
    expect((await put([{ country: "PK", priceMinor: -1, inStock: true }])).status).toBe(400);
    expect(
      (
        await put([
          { country: "PK", priceMinor: 1, inStock: true },
          { country: "PK", priceMinor: 2, inStock: true },
        ])
      ).status,
    ).toBe(400);
    expect((await put([])).status).toBe(400);
  });

  it("ignores a price field sent on an item save (the price lives only in price rows)", async () => {
    const res = await request(app)
      .post("/v1/catalog/admin/items")
      .set(staff)
      .send({ ...itemBody(), priceMinor: 1 });
    expect(res.status).toBe(201);
    expect(res.body).not.toHaveProperty("priceMinor");
  });

  it("returns 404 for prices of a missing item or packaging", async () => {
    const missing = "e".repeat(24);
    const body = { prices: [{ country: "PK", priceMinor: 1, inStock: true }] };
    expect(
      (await request(app).get(`/v1/catalog/admin/items/${missing}/prices`).set(staff)).status,
    ).toBe(404);
    expect(
      (await request(app).put(`/v1/catalog/admin/items/${missing}/prices`).set(staff).send(body))
        .status,
    ).toBe(404);
    expect(
      (await request(app).get(`/v1/catalog/admin/packagings/${missing}/prices`).set(staff)).status,
    ).toBe(404);
    expect(
      (
        await request(app)
          .put(`/v1/catalog/admin/packagings/${missing}/prices`)
          .set(staff)
          .send(body)
      ).status,
    ).toBe(404);
  });

  it("sets and reads packaging prices", async () => {
    const box = await upsertPackaging(makePackaging());
    const put = await request(app)
      .put(`/v1/catalog/admin/packagings/${box.id}/prices`)
      .set(staff)
      .send({ prices: [{ country: "PK", priceMinor: 90_000, inStock: true }] });
    expect(put.status).toBe(200);
    const get = await request(app).get(`/v1/catalog/admin/packagings/${box.id}/prices`).set(staff);
    expect(get.body).toEqual({ prices: [{ country: "PK", priceMinor: 90_000, inStock: true }] });
  });

  it("makes a newly priced item appear in the public catalog without any code change", async () => {
    const item = await upsertItem(makeItem({ name: "New item" }));
    const before = await request(app).get("/v1/catalog?country=pk");
    expect(before.body.items).toEqual([]);

    await request(app)
      .put(`/v1/catalog/admin/items/${item.id}/prices`)
      .set(staff)
      .send({ prices: [{ country: "PK", priceMinor: 999, inStock: true }] });

    const after = await request(app).get("/v1/catalog?country=pk");
    expect(after.body.items).toHaveLength(1);
    expect(after.body.items[0]).toMatchObject({ priceMinor: 999, item: { name: "New item" } });
  });
});
