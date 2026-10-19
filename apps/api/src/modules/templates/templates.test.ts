import {
  FeaturedTemplateSchema,
  PublicTemplateSchema,
  TemplateStartResponseSchema,
  type Design,
} from "@giftpop/contracts";
import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { createTestApp } from "../../../test/app";
import { clearDatabase, useTestMongo } from "../../../test/mongo";
import { CountryPriceModel, ItemModel, PackagingModel } from "../catalog/model";
import { upsertPrices } from "../catalog/service";
import { makeCountry } from "../countries/fixtures";
import { upsertCountry } from "../countries/service";
import { DesignModel } from "../designs/model";
import { saveDesign } from "../designs/service";
import {
  initCatalogModels,
  itemPrice,
  makeDesign,
  seedWorld,
  type World,
} from "../quotes/fixtures";
import { createIpLimiter } from "../quotes/rate-limit";

import { TemplateModel } from "./model";
import { resetStartRateLimit } from "./rate-limit";
import { createTemplatesRouter, templatesRouter } from "./router";

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
});

const app = createTestApp([{ path: "/templates", router: templatesRouter }]);
const STAFF = { "x-test-role": "staff" };
const ID = "a".repeat(24);

interface Setup {
  world: World;
  design: Design;
  shareId: string;
  /** A second live country selling the same items and packaging. */
  gbPrices: () => Promise<void>;
}

async function setup(): Promise<Setup> {
  const world = await seedWorld();
  const design = makeDesign(world.packaging, [
    [world.bar, 2],
    [world.soap, 1],
  ]);
  const { shareId } = await saveDesign("PK", design);
  await upsertCountry(makeCountry({ code: "GB", name: "United Kingdom", currency: "GBP" }));
  const gbPrices = () =>
    upsertPrices([
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
  await gbPrices();
  return { world, design, shareId, gbPrices };
}

const create = (body: unknown, headers: Record<string, string> = STAFF) =>
  request(app)
    .post("/v1/templates/admin")
    .set(headers)
    .send(body as object);

async function featured(
  shareId: string,
  overrides: Record<string, unknown> = {},
  countries = ["PK", "GB"],
) {
  const res = await create({ title: "Spa day", shareId, countries, ...overrides });
  expect(res.status).toBe(201);
  return FeaturedTemplateSchema.parse(res.body);
}

describe("staff routes", () => {
  it("creates a template, copies the design and lists it newest first", async () => {
    const { design, shareId } = await setup();
    const first = await featured(shareId, { title: "First" });
    const second = await featured(shareId, { title: "Second" });
    expect(first.design).toEqual(design);
    expect(first.active).toBe(true);

    const res = await request(app).get("/v1/templates/admin").set(STAFF);
    expect(res.status).toBe(200);
    expect((res.body as { id: string }[]).map((t) => t.id)).toEqual([second.id, first.id]);
  });

  it("rejects an unknown share id with 404", async () => {
    await setup();
    const res = await create({ title: "x", shareId: "nope123456", countries: ["PK"] });
    expect(res.status).toBe(404);
  });

  it("rejects an unknown or coming-soon country with 422", async () => {
    const { shareId } = await setup();
    await upsertCountry(
      makeCountry({ code: "TR", name: "Turkey", currency: "TRY", status: "coming_soon" }),
    );
    expect((await create({ title: "x", shareId, countries: ["TR"] })).status).toBe(422);
    expect((await create({ title: "x", shareId, countries: ["AU"] })).status).toBe(422);
  });

  it("reports problems per country when the design is not sellable somewhere", async () => {
    const { shareId, world } = await setup();
    await CountryPriceModel.deleteOne({ country: "GB", targetId: world.soap.id });
    const res = await create({ title: "x", shareId, countries: ["PK", "GB"] });
    expect(res.status).toBe(422);
    const error = (
      res.body as { error: { code: string; details: { country: string; problems: unknown[] } } }
    ).error;
    expect(error.code).toBe("DESIGN_INVALID");
    expect(error.details.country).toBe("GB");
    expect(error.details.problems.length).toBeGreaterThan(0);
  });

  it("validates the body with 400", async () => {
    const { shareId } = await setup();
    expect((await create({ shareId, countries: ["PK"] })).status).toBe(400);
    expect((await create({ title: "x", shareId, countries: [] })).status).toBe(400);
  });

  it("updates fields, validates changed countries, and answers 404 for unknown ids", async () => {
    const { shareId } = await setup();
    const t = await featured(shareId);
    const patched = await request(app)
      .patch(`/v1/templates/admin/${t.id}`)
      .set(STAFF)
      .send({ title: "Renamed", active: false, sortOrder: 5 });
    expect(patched.status).toBe(200);
    expect(patched.body).toMatchObject({ title: "Renamed", active: false, sortOrder: 5 });

    await upsertCountry(
      makeCountry({ code: "TR", name: "Turkey", currency: "TRY", status: "coming_soon" }),
    );
    const bad = await request(app)
      .patch(`/v1/templates/admin/${t.id}`)
      .set(STAFF)
      .send({ countries: ["TR"] });
    expect(bad.status).toBe(422);

    expect((await request(app).patch(`/v1/templates/admin/${ID}`).set(STAFF).send({})).status).toBe(
      404,
    );
    expect((await request(app).patch("/v1/templates/admin/xyz").set(STAFF).send({})).status).toBe(
      400,
    );
  });

  it("deletes a template and answers 404 afterwards", async () => {
    const { shareId } = await setup();
    const t = await featured(shareId);
    expect((await request(app).delete(`/v1/templates/admin/${t.id}`).set(STAFF)).status).toBe(204);
    expect((await request(app).delete(`/v1/templates/admin/${t.id}`).set(STAFF)).status).toBe(404);
  });

  it("answers 401 to anonymous callers on every admin route", async () => {
    const calls = [
      request(app).get("/v1/templates/admin"),
      request(app).post("/v1/templates/admin").send({}),
      request(app).patch(`/v1/templates/admin/${ID}`).send({}),
      request(app).delete(`/v1/templates/admin/${ID}`),
    ];
    for (const call of calls) expect((await call).status).toBe(401);
  });
});

describe("GET /v1/templates", () => {
  const list = (country: string) => request(app).get(`/v1/templates?country=${country}`);

  it("lists active templates for a country, sorted, with documents and cache header", async () => {
    const { shareId, world } = await setup();
    await featured(shareId, { title: "Beta", sortOrder: 1 });
    await featured(shareId, { title: "Alpha", sortOrder: 1 });
    await featured(shareId, { title: "Zed", sortOrder: 0 });
    const off = await featured(shareId, { title: "Hidden" });
    await TemplateModel.updateOne({ _id: off.id }, { active: false });

    const res = await list("pk");
    expect(res.status).toBe(200);
    expect(res.headers["cache-control"]).toBe("public, max-age=60, stale-while-revalidate=300");
    const parsed = (res.body as unknown[]).map((t) => PublicTemplateSchema.parse(t));
    expect(parsed.map((t) => t.title)).toEqual(["Zed", "Alpha", "Beta"]);
    expect(parsed[0]).toMatchObject({ country: "PK", currency: "PKR" });
    expect(parsed[0]?.packaging.id).toBe(world.packaging.id);
    expect(parsed[0]?.items.map((i) => i.id).sort()).toEqual([world.bar.id, world.soap.id].sort());
  });

  it("only lists templates that name the country", async () => {
    const { shareId } = await setup();
    await featured(shareId, {}, ["PK"]);
    expect((await list("GB")).body).toEqual([]);
  });

  it("answers 404 for an unknown country, 400 for a bad one and [] for coming soon", async () => {
    const { shareId } = await setup();
    await featured(shareId);
    await upsertCountry(
      makeCountry({ code: "TR", name: "Turkey", currency: "TRY", status: "coming_soon" }),
    );
    expect((await list("AU")).status).toBe(404);
    expect((await list("")).status).toBe(400);
    expect((await request(app).get("/v1/templates")).status).toBe(400);
    const soon = await list("TR");
    expect(soon.status).toBe(200);
    expect(soon.body).toEqual([]);
  });

  it("drops a template where an item lost its price, but keeps it where all are sold", async () => {
    const { shareId, world } = await setup();
    await featured(shareId);
    await CountryPriceModel.deleteOne({ country: "PK", targetId: world.soap.id });
    expect((await list("PK")).body).toEqual([]);
    expect(((await list("GB")).body as unknown[]).length).toBe(1);
  });

  it("drops a template when an item is out of stock there", async () => {
    const { shareId, world } = await setup();
    await featured(shareId);
    await CountryPriceModel.updateOne(
      { country: "PK", targetId: world.bar.id },
      { inStock: false },
    );
    expect((await list("PK")).body).toEqual([]);
    expect(((await list("GB")).body as unknown[]).length).toBe(1);
  });

  it("drops a template when an item is deactivated", async () => {
    const { shareId, world } = await setup();
    await featured(shareId);
    await ItemModel.updateOne({ _id: world.bar.id }, { active: false });
    expect((await list("PK")).body).toEqual([]);
    expect((await list("GB")).body).toEqual([]);
  });

  it("drops a template when the packaging is deactivated", async () => {
    const { shareId, world } = await setup();
    await featured(shareId);
    await PackagingModel.updateOne({ _id: world.packaging.id }, { active: false });
    expect((await list("PK")).body).toEqual([]);
  });
});

describe("POST /v1/templates/:id/start", () => {
  const start = (id: string, body?: object) => {
    const req = request(app).post(`/v1/templates/${id}/start`);
    return body ? req.send(body) : req;
  };

  it("returns the first live listed country and an independent copy of the design", async () => {
    const { shareId, design } = await setup();
    const t = await featured(shareId, {}, ["PK", "GB"]);

    const res = await start(t.id);
    expect(res.status).toBe(200);
    const parsed = TemplateStartResponseSchema.parse(res.body);
    expect(parsed.country).toBe("PK");
    expect(parsed.design).toEqual(design);

    // Mutating the response never touches the stored design.
    parsed.design.items[0]!.qty = 99;
    const stored = await TemplateModel.findById(t.id).lean();
    expect(stored?.design).toEqual(design);
    const again = TemplateStartResponseSchema.parse((await start(t.id)).body);
    expect(again.design).toEqual(design);
  });

  it("skips a listed country that is not live and honours a requested country", async () => {
    const { shareId } = await setup();
    const t = await featured(shareId, {}, ["PK", "GB"]);
    await upsertCountry(makeCountry({ status: "coming_soon" }));
    expect(TemplateStartResponseSchema.parse((await start(t.id, {})).body).country).toBe("GB");
    expect((await start(t.id, { country: "GB" })).status).toBe(200);
    expect((await start(t.id, { country: "PK" })).status).toBe(422);
    expect((await start(t.id, { country: "CN" })).status).toBe(422);
  });

  it("picks the first listed country that can still make the gift, not just the first live one", async () => {
    const { shareId, world } = await setup();
    const t = await featured(shareId, {}, ["PK", "GB"]);
    // PK is live but the bar is now out of stock there: GB is the first country that can make it.
    await upsertPrices([itemPrice(world.bar, "PK", 45_000, false)]);
    expect(TemplateStartResponseSchema.parse((await start(t.id, {})).body).country).toBe("GB");
    // Nowhere left: 422.
    await upsertPrices([itemPrice(world.bar, "GB", 450, false)]);
    expect((await start(t.id, {})).status).toBe(422);
  });

  it("answers 404 for unknown and inactive templates, 400 for bad input", async () => {
    const { shareId } = await setup();
    const t = await featured(shareId);
    expect((await start(ID)).status).toBe(404);
    await TemplateModel.updateOne({ _id: t.id }, { active: false });
    expect((await start(t.id)).status).toBe(404);
    expect((await start("nope")).status).toBe(400);
    expect((await start(t.id, { country: 5 })).status).toBe(400);
  });

  it("answers 422 when the template is no longer sellable there", async () => {
    const { shareId, world } = await setup();
    const t = await featured(shareId, {}, ["PK"]);
    await CountryPriceModel.deleteOne({ country: "PK", targetId: world.bar.id });
    expect((await start(t.id)).status).toBe(422);
  });

  it("limits starts per client with 429", async () => {
    const { shareId } = await setup();
    const t = await featured(shareId);
    const limited = createTestApp([
      {
        path: "/templates",
        router: createTemplatesRouter({ startLimiter: createIpLimiter({ limit: 2 }) }),
      },
    ]);
    const go = () => request(limited).post(`/v1/templates/${t.id}/start`);
    expect((await go()).status).toBe(200);
    expect((await go()).status).toBe(200);
    const third = await go();
    expect(third.status).toBe(429);
    expect(third.body).toMatchObject({ error: { code: "RATE_LIMITED" } });
  });
});
