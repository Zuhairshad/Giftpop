import { CatalogResponseSchema, ITEM_SHAPES, type Item } from "@giftpop/contracts";
import { Types } from "mongoose";
import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { createTestApp } from "../../../test/app";
import { clearDatabase, useTestMongo } from "../../../test/mongo";
import { makeCountry } from "../countries/fixtures";
import { upsertCountry } from "../countries/service";

import { initCatalogModels, itemBody, makeItem } from "./fixtures";
import { toItemDoc } from "./mappers";
import { ItemModel } from "./model";
import { catalogRouter } from "./router";
import { upsertPrices } from "./service";

vi.mock("../../middleware/require-staff", async () =>
  (await import("../countries/fixtures")).fakeRequireStaffModule(),
);

useTestMongo();
beforeAll(initCatalogModels);
beforeEach(clearDatabase);

const app = createTestApp([{ path: "/catalog", router: catalogRouter }]);
const staff = { "x-test-role": "staff" };
const TIMEOUT = 30_000;

async function priceIn(itemId: string, country = "PK"): Promise<void> {
  await upsertPrices([{ kind: "item", itemId, country, priceMinor: 900, inStock: true }]);
}

async function publicItem(id: string, country = "PK"): Promise<Item | undefined> {
  const res = await request(app).get(`/v1/catalog?country=${country}`);
  expect(res.status).toBe(200);
  const body = CatalogResponseSchema.parse(res.body);
  return body.items.find((entry) => entry.item.id === id)?.item;
}

async function staffItem(id: string): Promise<Item> {
  const res = await request(app).get(`/v1/catalog/admin/items/${id}`).set(staff);
  expect(res.status).toBe(200);
  return res.body as Item;
}

describe("item picker style", () => {
  it(
    "round-trips through create, staff read, replace and the public catalog",
    async () => {
      await upsertCountry(makeCountry());

      const created = await request(app)
        .post("/v1/catalog/admin/items")
        .set(staff)
        .send(itemBody({ pickerStyle: "list" }));
      expect(created.status).toBe(201);
      expect(created.body.pickerStyle).toBe("list");
      const id: string = created.body.id;

      expect((await staffItem(id)).pickerStyle).toBe("list");
      await priceIn(id);
      expect((await publicItem(id))?.pickerStyle).toBe("list");

      const replaced = await request(app)
        .put(`/v1/catalog/admin/items/${id}`)
        .set(staff)
        .send(itemBody({ pickerStyle: "tile" }));
      expect(replaced.status).toBe(200);
      expect(replaced.body.pickerStyle).toBe("tile");
      expect((await staffItem(id)).pickerStyle).toBe("tile");
      expect((await publicItem(id))?.pickerStyle).toBe("tile");

      const back = await request(app)
        .put(`/v1/catalog/admin/items/${id}`)
        .set(staff)
        .send(itemBody({ pickerStyle: "list" }));
      expect(back.status).toBe(200);
      expect((await publicItem(id))?.pickerStyle).toBe("list");
    },
    TIMEOUT,
  );

  it(
    "stores tile when a save request leaves pickerStyle out",
    async () => {
      const res = await request(app).post("/v1/catalog/admin/items").set(staff).send(itemBody());
      expect(res.status).toBe(201);
      expect(res.body.pickerStyle).toBe("tile");
      const stored = await ItemModel.collection.findOne({ _id: new Types.ObjectId(res.body.id) });
      expect(stored?.pickerStyle).toBe("tile");
    },
    TIMEOUT,
  );

  it(
    "reads an item stored without pickerStyle as tile, for staff and in the public catalog",
    async () => {
      await upsertCountry(makeCountry());
      const legacy = makeItem();
      const { pickerStyle, ...docWithoutStyle } = toItemDoc(legacy);
      void pickerStyle;
      // The raw driver skips the Mongoose default, like a document saved before pickerStyle existed.
      await ItemModel.collection.insertOne(docWithoutStyle);
      const stored = await ItemModel.collection.findOne({ _id: new Types.ObjectId(legacy.id) });
      expect(stored).not.toHaveProperty("pickerStyle");
      await priceIn(legacy.id);

      expect((await staffItem(legacy.id)).pickerStyle).toBe("tile");
      const list = await request(app).get("/v1/catalog/admin/items").set(staff);
      expect(list.status).toBe(200);
      expect(list.body.items[0].pickerStyle).toBe("tile");
      expect((await publicItem(legacy.id))?.pickerStyle).toBe("tile");
    },
    TIMEOUT,
  );

  it(
    "rejects an unknown pickerStyle with 400 on create and on replace, and keeps the stored one",
    async () => {
      const created = await request(app)
        .post("/v1/catalog/admin/items")
        .set(staff)
        .send(itemBody({ pickerStyle: "list" }));
      const id: string = created.body.id;

      const badCreate = await request(app)
        .post("/v1/catalog/admin/items")
        .set(staff)
        .send({ ...itemBody(), pickerStyle: "grid" });
      expect(badCreate.status).toBe(400);
      expect(badCreate.body.error.code).toBe("VALIDATION_ERROR");

      const badReplace = await request(app)
        .put(`/v1/catalog/admin/items/${id}`)
        .set(staff)
        .send({ ...itemBody(), pickerStyle: "List" });
      expect(badReplace.status).toBe(400);
      expect(badReplace.body.error.code).toBe("VALIDATION_ERROR");

      expect((await staffItem(id)).pickerStyle).toBe("list");
      expect(await ItemModel.countDocuments()).toBe(1);
    },
    TIMEOUT,
  );

  it(
    "refuses to create or replace an item without a staff session",
    async () => {
      const id = new Types.ObjectId().toHexString();
      const create = await request(app)
        .post("/v1/catalog/admin/items")
        .send(itemBody({ pickerStyle: "list" }));
      expect(create.status).toBe(401);
      const replace = await request(app)
        .put(`/v1/catalog/admin/items/${id}`)
        .send(itemBody({ pickerStyle: "list" }));
      expect(replace.status).toBe(401);
      expect(await ItemModel.countDocuments()).toBe(0);
    },
    TIMEOUT,
  );
});

describe("item shapes", () => {
  const NEW_SHAPES = ["perfume", "candle", "jewellery", "necklace", "bracelet", "cosmetic", "cupcake", "frame"] as const;

  it("lists the new shapes in the contract", () => {
    for (const shape of NEW_SHAPES) expect(ITEM_SHAPES).toContain(shape);
  });

  it(
    "accepts each new shape and reads it back for staff and in the public catalog",
    async () => {
      await upsertCountry(makeCountry());
      for (const shape of NEW_SHAPES) {
        const res = await request(app)
          .post("/v1/catalog/admin/items")
          .set(staff)
          .send(itemBody({ name: `A ${shape}`, shape }));
        expect(res.status, shape).toBe(201);
        expect(res.body.shape).toBe(shape);
        expect((await staffItem(res.body.id)).shape).toBe(shape);
        await priceIn(res.body.id);
        expect((await publicItem(res.body.id))?.shape).toBe(shape);
      }
    },
    TIMEOUT,
  );

  it(
    "rejects an unknown shape with 400",
    async () => {
      const res = await request(app)
        .post("/v1/catalog/admin/items")
        .set(staff)
        .send({ ...itemBody(), shape: "lamp" });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(await ItemModel.countDocuments()).toBe(0);
    },
    TIMEOUT,
  );
});
