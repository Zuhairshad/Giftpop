import { CatalogResponseSchema, type Packaging } from "@giftpop/contracts";
import { Types } from "mongoose";
import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { createTestApp } from "../../../test/app";
import { clearDatabase, useTestMongo } from "../../../test/mongo";
import { makeCountry } from "../countries/fixtures";
import { upsertCountry } from "../countries/service";

import { initCatalogModels, makePackaging, packagingBody } from "./fixtures";
import { toPackagingDoc } from "./mappers";
import { PackagingModel } from "./model";
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

async function priceIn(packagingId: string, country = "PK"): Promise<void> {
  await upsertPrices([
    { kind: "packaging", packagingId, country, priceMinor: 5000, inStock: true },
  ]);
}

async function publicPackaging(id: string, country = "PK"): Promise<Packaging | undefined> {
  const res = await request(app).get(`/v1/catalog?country=${country}`);
  expect(res.status).toBe(200);
  const body = CatalogResponseSchema.parse(res.body);
  return body.packagings.find((entry) => entry.packaging.id === id)?.packaging;
}

describe("packaging kind", () => {
  it(
    "round-trips through create, staff read, replace and the public catalog",
    async () => {
      await upsertCountry(makeCountry());

      const created = await request(app)
        .post("/v1/catalog/admin/packagings")
        .set(staff)
        .send(packagingBody({ kind: "bouquet" }));
      expect(created.status).toBe(201);
      expect(created.body.kind).toBe("bouquet");
      const id: string = created.body.id;

      const read = await request(app).get(`/v1/catalog/admin/packagings/${id}`).set(staff);
      expect(read.status).toBe(200);
      expect(read.body.kind).toBe("bouquet");

      await priceIn(id);
      expect((await publicPackaging(id))?.kind).toBe("bouquet");

      const replaced = await request(app)
        .put(`/v1/catalog/admin/packagings/${id}`)
        .set(staff)
        .send(packagingBody({ kind: "basket" }));
      expect(replaced.status).toBe(200);
      expect(replaced.body.kind).toBe("basket");
      expect(
        (await request(app).get(`/v1/catalog/admin/packagings/${id}`).set(staff)).body.kind,
      ).toBe("basket");
      expect((await publicPackaging(id))?.kind).toBe("basket");
    },
    TIMEOUT,
  );

  it(
    "stores box when a save request leaves kind out",
    async () => {
      const { kind, ...withoutKind } = packagingBody({ kind: "mug" });
      void kind;
      const res = await request(app)
        .post("/v1/catalog/admin/packagings")
        .set(staff)
        .send(withoutKind);
      expect(res.status).toBe(201);
      expect(res.body.kind).toBe("box");
    },
    TIMEOUT,
  );

  it(
    "reads a packaging stored without kind as box, for staff and in the public catalog",
    async () => {
      await upsertCountry(makeCountry());
      const legacy = makePackaging();
      const { kind, ...docWithoutKind } = toPackagingDoc(legacy);
      void kind;
      // The raw driver skips the Mongoose default, like a document saved before kind existed.
      await PackagingModel.collection.insertOne(docWithoutKind);
      const stored = await PackagingModel.collection.findOne({
        _id: new Types.ObjectId(legacy.id),
      });
      expect(stored).not.toHaveProperty("kind");
      await priceIn(legacy.id);

      const read = await request(app).get(`/v1/catalog/admin/packagings/${legacy.id}`).set(staff);
      expect(read.status).toBe(200);
      expect(read.body.kind).toBe("box");

      const list = await request(app).get("/v1/catalog/admin/packagings").set(staff);
      expect(list.body.items[0].kind).toBe("box");

      expect((await publicPackaging(legacy.id))?.kind).toBe("box");
    },
    TIMEOUT,
  );

  it(
    "rejects an unknown kind with 400 on create and on replace, and keeps the stored kind",
    async () => {
      const created = await request(app)
        .post("/v1/catalog/admin/packagings")
        .set(staff)
        .send(packagingBody({ kind: "bouquet" }));
      const id: string = created.body.id;

      const badCreate = await request(app)
        .post("/v1/catalog/admin/packagings")
        .set(staff)
        .send({ ...packagingBody(), kind: "crate" });
      expect(badCreate.status).toBe(400);
      expect(badCreate.body.error.code).toBe("VALIDATION_ERROR");

      const badReplace = await request(app)
        .put(`/v1/catalog/admin/packagings/${id}`)
        .set(staff)
        .send({ ...packagingBody(), kind: "Bouquet" });
      expect(badReplace.status).toBe(400);
      expect(badReplace.body.error.code).toBe("VALIDATION_ERROR");

      expect(
        (await request(app).get(`/v1/catalog/admin/packagings/${id}`).set(staff)).body.kind,
      ).toBe("bouquet");
      expect(await PackagingModel.countDocuments()).toBe(1);
    },
    TIMEOUT,
  );

  it(
    "refuses to create or replace a packaging without a staff session",
    async () => {
      const id = new Types.ObjectId().toHexString();
      const create = await request(app)
        .post("/v1/catalog/admin/packagings")
        .send(packagingBody({ kind: "basket" }));
      expect(create.status).toBe(401);
      const replace = await request(app)
        .put(`/v1/catalog/admin/packagings/${id}`)
        .send(packagingBody({ kind: "basket" }));
      expect(replace.status).toBe(401);
      expect(await PackagingModel.countDocuments()).toBe(0);
    },
    TIMEOUT,
  );
});
