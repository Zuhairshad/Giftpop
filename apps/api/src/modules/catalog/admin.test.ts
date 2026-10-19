import type { Item } from "@giftpop/contracts";
import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { createTestApp } from "../../../test/app";
import { clearDatabase, useTestMongo } from "../../../test/mongo";

import { initCatalogModels, itemBody, makeItem, makePackaging, packagingBody } from "./fixtures";
import { catalogRouter } from "./router";
import { upsertItem, upsertPackaging } from "./service";

vi.mock("../../middleware/require-staff", async () =>
  (await import("../countries/fixtures")).fakeRequireStaffModule(),
);

useTestMongo();
beforeAll(initCatalogModels);
beforeEach(clearDatabase);

const app = createTestApp([{ path: "/catalog", router: catalogRouter }]);
const staff = { "x-test-role": "staff" };

describe("admin items", () => {
  it("creates an item (201) with a server-made id and no Mongo internals", async () => {
    const res = await request(app).post("/v1/catalog/admin/items").set(staff).send(itemBody());
    expect(res.status).toBe(201);
    expect(res.body.id).toMatch(/^[a-f\d]{24}$/);
    expect(res.body).toMatchObject(itemBody());
    expect(res.body).not.toHaveProperty("_id");
    expect(res.body).not.toHaveProperty("__v");
  });

  it("rejects an invalid item with 400 (personalizable without a limit, bad colour, float size)", async () => {
    const post = (body: unknown) =>
      request(app)
        .post("/v1/catalog/admin/items")
        .set(staff)
        .send(body as object);
    expect((await post(itemBody({ personalizable: true }))).status).toBe(400);
    expect((await post(itemBody({ color: "red" }))).status).toBe(400);
    expect((await post(itemBody({ sizeUnits: 1.5 }))).status).toBe(400);
    expect((await post({})).body.error.code).toBe("VALIDATION_ERROR");
  });

  it("gets one item, 404 for a missing id, 400 for a malformed id", async () => {
    const item = await upsertItem(makeItem());
    const found = await request(app).get(`/v1/catalog/admin/items/${item.id}`).set(staff);
    expect(found.status).toBe(200);
    expect(found.body).toEqual(item);
    expect(
      (
        await request(app)
          .get(`/v1/catalog/admin/items/${"b".repeat(24)}`)
          .set(staff)
      ).status,
    ).toBe(404);
    expect((await request(app).get("/v1/catalog/admin/items/nope").set(staff)).status).toBe(400);
  });

  it("fully replaces an item: omitted optional fields are removed", async () => {
    const image = { url: "u", width: 1, height: 1, anchor: { x: 0, y: 0 } };
    const item = await upsertItem(
      makeItem({ personalizable: true, personalizationMaxLength: 10, image }),
    );

    const res = await request(app)
      .put(`/v1/catalog/admin/items/${item.id}`)
      .set(staff)
      .send(itemBody({ name: "Renamed", active: false }));

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: item.id, name: "Renamed", active: false });
    expect(res.body).not.toHaveProperty("image");
    expect(res.body).not.toHaveProperty("personalizationMaxLength");
    expect(
      (await request(app).get(`/v1/catalog/admin/items/${item.id}`).set(staff)).body.name,
    ).toBe("Renamed");
  });

  it("returns 404 when replacing a missing item, and does not create it", async () => {
    const missing = "c".repeat(24);
    const res = await request(app)
      .put(`/v1/catalog/admin/items/${missing}`)
      .set(staff)
      .send(itemBody());
    expect(res.status).toBe(404);
    expect((await request(app).get(`/v1/catalog/admin/items/${missing}`).set(staff)).status).toBe(
      404,
    );
  });

  it("lists with pagination, search, category and active filters", async () => {
    await upsertItem(makeItem({ name: "Dark bar", category: "chocolates", sortOrder: 1 }));
    await upsertItem(makeItem({ name: "Milk bar", category: "chocolates", sortOrder: 2 }));
    await upsertItem(makeItem({ name: "Red rose", category: "flowers", sortOrder: 3 }));
    await upsertItem(
      makeItem({ name: "Old card", category: "cards", active: false, sortOrder: 4 }),
    );
    const get = (query: string) => request(app).get(`/v1/catalog/admin/items?${query}`).set(staff);

    const all = await get("");
    expect(all.body).toMatchObject({ page: 1, pageSize: 20, total: 4 });
    expect(all.body.items.map((i: Item) => i.name)).toEqual([
      "Dark bar",
      "Milk bar",
      "Red rose",
      "Old card",
    ]);

    const page2 = await get("page=2&pageSize=3");
    expect(page2.body.items.map((i: Item) => i.name)).toEqual(["Old card"]);
    expect(page2.body.total).toBe(4);

    expect((await get("search=BAR")).body.items.map((i: Item) => i.name)).toEqual([
      "Dark bar",
      "Milk bar",
    ]);
    expect((await get("category=flowers")).body.items).toHaveLength(1);
    expect((await get("active=false")).body.items.map((i: Item) => i.name)).toEqual(["Old card"]);
    expect((await get("active=true")).body.total).toBe(3);
  });

  it("treats search text literally, not as a regex", async () => {
    await upsertItem(makeItem({ name: "Gift (large)" }));
    await upsertItem(makeItem({ name: "Gift small" }));
    const res = await request(app).get("/v1/catalog/admin/items?search=(large)").set(staff);
    expect(res.body.items.map((i: Item) => i.name)).toEqual(["Gift (large)"]);
  });

  it("rejects bad list queries with 400", async () => {
    for (const query of ["page=0", "pageSize=101", "active=maybe"]) {
      expect((await request(app).get(`/v1/catalog/admin/items?${query}`).set(staff)).status).toBe(
        400,
      );
    }
  });

  it("lists distinct categories sorted", async () => {
    await upsertItem(makeItem({ category: "flowers" }));
    await upsertItem(makeItem({ category: "care" }));
    await upsertItem(makeItem({ category: "flowers", active: false }));
    const res = await request(app).get("/v1/catalog/admin/categories").set(staff);
    expect(res.body).toEqual(["care", "flowers"]);
  });
});

describe("admin packagings", () => {
  it("creates, reads, replaces and lists a packaging", async () => {
    const created = await request(app)
      .post("/v1/catalog/admin/packagings")
      .set(staff)
      .send(packagingBody({ slug: "bouquet-fan", name: "Bouquet" }));
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ slug: "bouquet-fan", layers: {}, description: "" });
    const { id } = created.body as { id: string };

    const replaced = await request(app)
      .put(`/v1/catalog/admin/packagings/${id}`)
      .set(staff)
      .send(packagingBody({ slug: "bouquet-fan", name: "Big bouquet", maxItems: 12 }));
    expect(replaced.status).toBe(200);
    expect(replaced.body).toMatchObject({ id, name: "Big bouquet", maxItems: 12 });

    expect(
      (await request(app).get(`/v1/catalog/admin/packagings/${id}`).set(staff)).body.name,
    ).toBe("Big bouquet");
    const list = await request(app).get("/v1/catalog/admin/packagings?pageSize=5").set(staff);
    expect(list.body).toMatchObject({ page: 1, pageSize: 5, total: 1 });
    expect(list.body.items[0].id).toBe(id);
  });

  it("rejects a duplicate slug with 409", async () => {
    await upsertPackaging(makePackaging({ slug: "box-grid" }));
    const res = await request(app)
      .post("/v1/catalog/admin/packagings")
      .set(staff)
      .send(packagingBody({ slug: "box-grid" }));
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("CONFLICT");
  });

  it("rejects invalid packagings with 400 and a missing packaging with 404", async () => {
    const post = (body: unknown) =>
      request(app)
        .post("/v1/catalog/admin/packagings")
        .set(staff)
        .send(body as object);
    expect((await post(packagingBody({ minItems: 9, maxItems: 4 }))).status).toBe(400);
    expect((await post(packagingBody({ layoutType: "Box Grid" }))).status).toBe(400);
    expect((await post(packagingBody({ wrapperColors: [] }))).status).toBe(400);
    const missing = "d".repeat(24);
    expect(
      (await request(app).get(`/v1/catalog/admin/packagings/${missing}`).set(staff)).status,
    ).toBe(404);
    expect(
      (
        await request(app)
          .put(`/v1/catalog/admin/packagings/${missing}`)
          .set(staff)
          .send(packagingBody())
      ).status,
    ).toBe(404);
  });

  it("stores layer images", async () => {
    const back = { url: "u", width: 10, height: 20, anchor: { x: 0.5, y: 1 } };
    const res = await request(app)
      .post("/v1/catalog/admin/packagings")
      .set(staff)
      .send(packagingBody({ layers: { back } }));
    expect(res.body.layers).toEqual({ back });
  });
});
