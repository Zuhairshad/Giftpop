import { CountrySchema, PublicCountrySchema } from "@giftpop/contracts";
import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { createTestApp } from "../../../test/app";
import { clearDatabase, useTestMongo } from "../../../test/mongo";

import { makeCountry } from "./fixtures";
import { CountryModel } from "./model";
import { countriesRouter } from "./router";
import { upsertCountry } from "./service";

vi.mock("../../middleware/require-staff", async () =>
  (await import("./fixtures")).fakeRequireStaffModule(),
);

useTestMongo();
beforeAll(async () => {
  await CountryModel.init();
});
beforeEach(clearDatabase);

const app = createTestApp([{ path: "/countries", router: countriesRouter }]);
const asOwner = { "x-test-role": "owner" };
const asStaff = { "x-test-role": "staff" };

describe("GET /v1/countries", () => {
  it("lists live and coming-soon countries without payment instructions, with cache headers", async () => {
    await upsertCountry(makeCountry());
    await upsertCountry(
      makeCountry({ code: "TR", name: "Turkey", currency: "TRY", status: "coming_soon" }),
    );

    const res = await request(app).get("/v1/countries");

    expect(res.status).toBe(200);
    expect(res.headers["cache-control"]).toBe("public, max-age=60, stale-while-revalidate=300");
    expect(res.body).toHaveLength(2);
    for (const country of res.body) {
      expect(() => PublicCountrySchema.strict().parse(country)).not.toThrow();
      expect(country).not.toHaveProperty("paymentInstructions");
      expect(country).not.toHaveProperty("_id");
    }
    expect(res.body.map((c: { status: string }) => c.status).sort()).toEqual([
      "coming_soon",
      "live",
    ]);
  });

  it("returns an empty list when there are no countries", async () => {
    const res = await request(app).get("/v1/countries");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe("GET /v1/countries/admin", () => {
  it("returns full countries for staff", async () => {
    await upsertCountry(makeCountry());
    const res = await request(app).get("/v1/countries/admin").set(asStaff);
    expect(res.status).toBe(200);
    expect(CountrySchema.strict().parse(res.body[0])).toEqual(makeCountry());
  });

  it("rejects anonymous requests", async () => {
    const res = await request(app).get("/v1/countries/admin");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHENTICATED");
  });
});

describe("POST /v1/countries", () => {
  it("lets an owner create a country (201) and stores it", async () => {
    const res = await request(app).post("/v1/countries").set(asOwner).send(makeCountry());
    expect(res.status).toBe(201);
    expect(res.body).toEqual(makeCountry());
    expect(await CountryModel.countDocuments({ code: "PK" })).toBe(1);
  });

  it("rejects staff who are not owners (403) and anonymous requests (401)", async () => {
    const staff = await request(app).post("/v1/countries").set(asStaff).send(makeCountry());
    expect(staff.status).toBe(403);
    const anon = await request(app).post("/v1/countries").send(makeCountry());
    expect(anon.status).toBe(401);
    expect(await CountryModel.countDocuments()).toBe(0);
  });

  it("rejects a duplicate code with 409", async () => {
    await request(app).post("/v1/countries").set(asOwner).send(makeCountry());
    const res = await request(app)
      .post("/v1/countries")
      .set(asOwner)
      .send(makeCountry({ name: "Again" }));
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("CONFLICT");
  });

  it("rejects an invalid body with 400", async () => {
    const res = await request(app)
      .post("/v1/countries")
      .set(asOwner)
      .send({ ...makeCountry(), currency: "pkr", shipping: { flatMinor: 1.5 } });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("accepts a brand new country with no code changes", async () => {
    const nepal = makeCountry({
      code: "NP",
      name: "Nepal",
      currency: "NPR",
      status: "coming_soon",
    });
    const res = await request(app).post("/v1/countries").set(asOwner).send(nepal);
    expect(res.status).toBe(201);
    const list = await request(app).get("/v1/countries");
    expect(list.body.map((c: { code: string }) => c.code)).toContain("NP");
  });
});

describe("PUT /v1/countries/:code", () => {
  it("merge-updates only the fields sent and accepts a lower-case code", async () => {
    await upsertCountry(makeCountry());
    const res = await request(app)
      .put("/v1/countries/pk")
      .set(asOwner)
      .send({ status: "coming_soon", paymentModes: ["prepaid"] });
    expect(res.status).toBe(200);
    expect(res.body).toEqual(makeCountry({ status: "coming_soon", paymentModes: ["prepaid"] }));
  });

  it("replaces a nested object whole, so dropping freeOverMinor removes it", async () => {
    await upsertCountry(makeCountry());
    const res = await request(app)
      .put("/v1/countries/PK")
      .set(asOwner)
      .send({ shipping: { flatMinor: 100, deliveryDays: { min: 1, max: 2 } } });
    expect(res.status).toBe(200);
    expect(res.body.shipping).toEqual({ flatMinor: 100, deliveryDays: { min: 1, max: 2 } });
  });

  it("returns the country unchanged for an empty patch", async () => {
    await upsertCountry(makeCountry());
    const res = await request(app).put("/v1/countries/PK").set(asOwner).send({});
    expect(res.status).toBe(200);
    expect(res.body).toEqual(makeCountry());
  });

  it("returns 404 for an unknown country", async () => {
    const res = await request(app).put("/v1/countries/ZZ").set(asOwner).send({ name: "Nowhere" });
    expect(res.status).toBe(404);
  });

  it("rejects a malformed code and an invalid body with 400", async () => {
    expect((await request(app).put("/v1/countries/PAK").set(asOwner).send({})).status).toBe(400);
    expect(
      (
        await request(app)
          .put("/v1/countries/PK")
          .set(asOwner)
          .send({ paymentModes: ["bitcoin"] })
      ).status,
    ).toBe(400);
  });

  it("rejects staff (403) and anonymous requests (401)", async () => {
    await upsertCountry(makeCountry());
    expect(
      (await request(app).put("/v1/countries/PK").set(asStaff).send({ name: "X" })).status,
    ).toBe(403);
    expect((await request(app).put("/v1/countries/PK").send({ name: "X" })).status).toBe(401);
    expect((await CountryModel.findOne({ code: "PK" }).lean())?.name).toBe("Pakistan");
  });
});

describe("upsertCountry", () => {
  it("is idempotent and replaces settings by code", async () => {
    await upsertCountry(makeCountry());
    await upsertCountry(makeCountry());
    expect(await CountryModel.countDocuments()).toBe(1);

    const changed = await upsertCountry(makeCountry({ name: "Islamic Republic of Pakistan" }));
    expect(changed.name).toBe("Islamic Republic of Pakistan");
    expect(await CountryModel.countDocuments()).toBe(1);
  });
});
