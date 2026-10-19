import {
  DesignInvalidDetailsSchema,
  SaveDesignResponseSchema,
  SharedDesignViewSchema,
  SHARE_ID_LENGTH,
} from "@giftpop/contracts";
import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { createTestApp } from "../../../test/app";
import { clearDatabase, useTestMongo } from "../../../test/mongo";
import { CountryPriceModel, ItemModel } from "../catalog/model";
import { upsertPrices } from "../catalog/service";
import { makeCountry } from "../countries/fixtures";
import { upsertCountry } from "../countries/service";
import { initCatalogModels, itemPrice, makeDesign, seedWorld } from "../quotes/fixtures";
import { createIpLimiter } from "../quotes/rate-limit";

import { DesignModel } from "./model";
import { resetSaveRateLimit } from "./rate-limit";
import { createDesignsRouter, designsRouter } from "./router";

// Real ids by default; a test can queue fixed ones to force a collision.
vi.mock("nanoid", async (importOriginal) => {
  const actual = await importOriginal<{ nanoid: (size?: number) => string }>();
  return { nanoid: vi.fn(actual.nanoid) };
});
const { nanoid } = await import("nanoid");

useTestMongo();
beforeAll(async () => {
  await initCatalogModels();
  await DesignModel.init();
});
beforeEach(async () => {
  await clearDatabase();
  resetSaveRateLimit();
});

const app = createTestApp([{ path: "/designs", router: designsRouter }]);
const save = (body: unknown) =>
  request(app)
    .post("/v1/designs")
    .send(body as object);
const fetchShared = (shareId: string) => request(app).get(`/v1/designs/${shareId}`);

async function savedWorld() {
  const world = await seedWorld();
  const design = makeDesign(world.packaging, [
    [world.bar, 2],
    [world.soap, 1],
  ]);
  const res = await save({ country: "PK", design });
  expect(res.status).toBe(201);
  return { ...world, design, shareId: SaveDesignResponseSchema.parse(res.body).shareId };
}

describe("POST /v1/designs", () => {
  it("saves a valid design and answers 201 with a 10-char url-safe share id", async () => {
    const { packaging, bar } = await seedWorld();
    const design = makeDesign(packaging, [[bar, 3]]);

    const res = await save({ country: "PK", design });

    expect(res.status).toBe(201);
    const saved = SaveDesignResponseSchema.parse(res.body);
    expect(saved.shareId).toHaveLength(SHARE_ID_LENGTH);
    expect(saved.shareId).toMatch(/^[A-Za-z0-9_-]{10}$/);
    expect(saved.country).toBe("PK");
    expect(saved.design).toEqual(design);
    expect(Number.isNaN(Date.parse(saved.createdAt))).toBe(false);
  });

  it("stores the date as a Date and the design as given, with the unique and createdAt indexes", async () => {
    const { packaging, bar } = await seedWorld();
    const design = makeDesign(packaging, [[bar, 2]]);
    const { body } = await save({ country: "PK", design });

    const raw = await DesignModel.collection.findOne({ shareId: body.shareId });
    expect(raw?.createdAt).toBeInstanceOf(Date);
    expect(raw?.country).toBe("PK");
    expect(raw?.design).toEqual(design);

    const indexes = await DesignModel.collection.indexes();
    expect(indexes.find((i) => i.key.shareId === 1)?.unique).toBe(true);
    expect(indexes.some((i) => i.key.createdAt !== undefined)).toBe(true);
  });

  it("gives each save its own share id", async () => {
    const { packaging, bar } = await seedWorld();
    const design = makeDesign(packaging, [[bar, 2]]);
    const a = await save({ country: "PK", design });
    const b = await save({ country: "PK", design });
    expect(a.body.shareId).not.toBe(b.body.shareId);
    expect(await DesignModel.countDocuments()).toBe(2);
  });

  it("draws another id when the first one is taken", async () => {
    const { packaging, bar } = await seedWorld();
    const design = makeDesign(packaging, [[bar, 2]]);
    vi.mocked(nanoid).mockReturnValueOnce("AAAAAAAAAA");
    expect((await save({ country: "PK", design })).body.shareId).toBe("AAAAAAAAAA");

    vi.mocked(nanoid).mockReturnValueOnce("AAAAAAAAAA").mockReturnValueOnce("BBBBBBBBBB");
    const res = await save({ country: "PK", design });

    expect(res.status).toBe(201);
    expect(res.body.shareId).toBe("BBBBBBBBBB");
  });

  it("rejects an invalid design with 422 DESIGN_INVALID and stores nothing", async () => {
    const { packaging, bar } = await seedWorld();

    const res = await save({ country: "PK", design: makeDesign(packaging, [[bar, 1]]) });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("DESIGN_INVALID");
    const details = DesignInvalidDetailsSchema.parse(res.body.error.details);
    expect(details.problems.map((p) => p.code)).toEqual(["TOO_FEW_ITEMS"]);
    expect(await DesignModel.countDocuments()).toBe(0);
  });

  it("returns 404 for an unknown country and 422 for a coming-soon one", async () => {
    const { packaging, bar } = await seedWorld();
    await upsertCountry(makeCountry({ code: "TR", currency: "TRY", status: "coming_soon" }));
    const design = makeDesign(packaging, [[bar, 2]]);

    expect((await save({ country: "ZZ", design })).status).toBe(404);
    const soon = await save({ country: "TR", design });
    expect(soon.status).toBe(422);
    expect(soon.body.error.code).toBe("VALIDATION_ERROR");
    expect(await DesignModel.countDocuments()).toBe(0);
  });

  it("returns 400 for a body that does not match the contract", async () => {
    const { packaging, bar } = await seedWorld();
    const design = makeDesign(packaging, [[bar, 2]]);
    for (const body of [{}, { country: "PK" }, { country: "pk", design }, { design }]) {
      const res = await save(body);
      expect(res.status, JSON.stringify(body)).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    }
  });

  it("returns 429 RATE_LIMITED once the limit is spent", async () => {
    const { packaging, bar } = await seedWorld();
    const limited = createTestApp([
      {
        path: "/designs",
        router: createDesignsRouter({ saveLimiter: createIpLimiter({ limit: 2 }) }),
      },
    ]);
    const body = { country: "PK", design: makeDesign(packaging, [[bar, 2]]) };

    expect((await request(limited).post("/v1/designs").send(body)).status).toBe(201);
    expect((await request(limited).post("/v1/designs").send(body)).status).toBe(201);
    const res = await request(limited).post("/v1/designs").send(body);

    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe("RATE_LIMITED");
    expect(await DesignModel.countDocuments()).toBe(2);
  });
});

describe("GET /v1/designs/:shareId", () => {
  it("round trips: the saved design comes back unchanged with its packaging and items", async () => {
    const { shareId, design, packaging, bar, soap } = await savedWorld();

    const res = await fetchShared(shareId);

    expect(res.status).toBe(200);
    expect(res.headers["cache-control"]).toBe("public, max-age=60, stale-while-revalidate=300");
    const view = SharedDesignViewSchema.parse(res.body);
    expect(view.shareId).toBe(shareId);
    expect(view.country).toBe("PK");
    expect(view.currency).toBe("PKR");
    expect(view.design).toEqual(design);
    expect(view.packaging).toEqual(packaging);
    expect(view.packagingAvailable).toBe(true);
    expect(view.items).toEqual([bar, soap]);
    expect(view.unavailableItemIds).toEqual([]);
  });

  it("keeps the design personalisation, including empty item names", async () => {
    const { packaging, bar } = await seedWorld();
    const design = makeDesign(packaging, [[bar, 2]], {
      personalisation: { cardMessage: "", recipientName: "", itemNames: {} },
    });
    const { body } = await save({ country: "PK", design });

    const view = SharedDesignViewSchema.parse((await fetchShared(body.shareId)).body);

    expect(view.design.personalisation).toEqual({
      cardMessage: "",
      recipientName: "",
      itemNames: {},
    });
  });

  it("still answers when an item loses its price, listing it as unavailable", async () => {
    const { shareId, soap, bar } = await savedWorld();
    await CountryPriceModel.deleteOne({ country: "PK", kind: "item", targetId: soap.id });

    const res = await fetchShared(shareId);

    expect(res.status).toBe(200);
    const view = SharedDesignViewSchema.parse(res.body);
    expect(view.unavailableItemIds).toEqual([soap.id]);
    expect(view.items.map((i) => i.id)).toEqual([bar.id, soap.id]);
  });

  it("lists an inactive item as unavailable and keeps its document", async () => {
    const { shareId, bar } = await savedWorld();
    await ItemModel.updateOne({ _id: bar.id }, { active: false });

    const view = SharedDesignViewSchema.parse((await fetchShared(shareId)).body);

    expect(view.unavailableItemIds).toEqual([bar.id]);
    expect(view.items.find((i) => i.id === bar.id)?.active).toBe(false);
  });

  it("lists a removed item as unavailable and leaves its document out", async () => {
    const { shareId, bar, soap } = await savedWorld();
    await ItemModel.deleteOne({ _id: soap.id });

    const view = SharedDesignViewSchema.parse((await fetchShared(shareId)).body);

    expect(view.unavailableItemIds).toEqual([soap.id]);
    expect(view.items.map((i) => i.id)).toEqual([bar.id]);
  });

  it("lists all unsellable items at once", async () => {
    const { shareId, bar, soap } = await savedWorld();
    await CountryPriceModel.deleteMany({ country: "PK", kind: "item" });

    const view = SharedDesignViewSchema.parse((await fetchShared(shareId)).body);

    expect(view.unavailableItemIds).toEqual([bar.id, soap.id]);
    expect(view.items).toHaveLength(2);
  });

  it("sets packagingAvailable false when the packaging has no price now", async () => {
    const { shareId, packaging } = await savedWorld();
    await CountryPriceModel.deleteOne({ country: "PK", kind: "packaging", targetId: packaging.id });

    const res = await fetchShared(shareId);

    expect(res.status).toBe(200);
    const view = SharedDesignViewSchema.parse(res.body);
    expect(view.packagingAvailable).toBe(false);
    expect(view.packaging.id).toBe(packaging.id);
  });

  it("does not fail when the country has since gone back to coming soon", async () => {
    const { shareId, bar, soap } = await savedWorld();
    await upsertCountry(makeCountry({ status: "coming_soon" }));

    const view = SharedDesignViewSchema.parse((await fetchShared(shareId)).body);

    expect(view.packagingAvailable).toBe(false);
    expect(view.unavailableItemIds).toEqual([bar.id, soap.id]);
  });

  it("returns 404 for an unknown share id, without cache headers", async () => {
    const res = await fetchShared("abcdefghij");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
    expect(res.headers["cache-control"]).toBeUndefined();
  });

  it("returns 400 for a malformed share id", async () => {
    for (const id of ["short", "has space!!", "a".repeat(25), "bad.id.here"]) {
      const res = await fetchShared(encodeURIComponent(id));
      expect(res.status, id).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    }
  });
});

describe("GET /v1/designs/:shareId: corrupt stored data", () => {
  it("answers 500 INTERNAL without details when the stored design no longer parses", async () => {
    await DesignModel.collection.insertOne({
      shareId: "BADSTORED1",
      country: "PK",
      design: { nope: true },
      createdAt: new Date(),
    });
    const res = await fetchShared("BADSTORED1");
    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("INTERNAL");
    expect(res.body.error).not.toHaveProperty("details");
  });
});

describe("GET /v1/designs/:shareId?country=", () => {
  it("shows availability for the country being viewed, not the one the gift was saved in", async () => {
    const { packaging, bar, soap, shareId } = await savedWorld();
    await upsertCountry(makeCountry({ code: "GB", name: "United Kingdom", currency: "GBP" }));
    await upsertPrices([
      {
        kind: "packaging",
        packagingId: packaging.id,
        country: "GB",
        priceMinor: 900,
        inStock: true,
      },
      itemPrice(bar, "GB", 450),
      itemPrice(soap, "GB", 120),
    ]);
    // In the saved country the bar lost its price; in GB everything is still sold.
    await CountryPriceModel.deleteOne({ kind: "item", targetId: bar.id, country: "PK" });

    const saved = SharedDesignViewSchema.parse((await fetchShared(shareId)).body);
    expect(saved.country).toBe("PK");
    expect(saved.unavailableItemIds).toEqual([bar.id]);

    const inGb = SharedDesignViewSchema.parse((await fetchShared(`${shareId}?country=gb`)).body);
    expect(inGb.country).toBe("GB");
    expect(inGb.currency).toBe("GBP");
    expect(inGb.unavailableItemIds).toEqual([]);
    expect(inGb.packagingAvailable).toBe(true);
  });

  it("rejects a malformed country with 400", async () => {
    const { shareId } = await savedWorld();
    expect((await fetchShared(`${shareId}?country=nope`)).status).toBe(400);
  });
});
