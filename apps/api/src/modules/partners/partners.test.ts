import { PARTNER_HONEYPOT_FIELD, PartnerRequestSchema } from "@giftpop/contracts";
import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { createTestApp } from "../../../test/app";
import { clearDatabase, useTestMongo } from "../../../test/mongo";
import { makeCountry } from "../countries/fixtures";
import { CountryModel } from "../countries/model";
import { OutboxModel } from "../notifications/model";

import { PartnerRequestModel } from "./model";
import { resetPartnerRateLimit } from "./rate-limit";
import { partnersRouter } from "./router";
import { alertFor } from "./service";

vi.mock("../../middleware/require-staff", async () =>
  (await import("../countries/fixtures")).fakeRequireStaffModule(),
);

useTestMongo();
beforeAll(async () => {
  await PartnerRequestModel.init();
});
beforeEach(async () => {
  await clearDatabase();
  resetPartnerRateLimit();
  await CountryModel.create([
    makeCountry(),
    makeCountry({ code: "TR", name: "Turkey", currency: "TRY", status: "coming_soon" }),
  ]);
});

const app = createTestApp([{ path: "/partner-requests", router: partnersRouter }]);
const asStaff = { "x-test-role": "staff" };
const ACTOR = "a".repeat(24);

const brand = {
  kind: "brand",
  brandName: "Rose & Co",
  contactName: "Ayesha Khan",
  email: "  Ayesha@Example.COM ",
  phone: "+92 300 1234567",
  country: "PK",
  productCategories: ["Candles"],
  link: "https://instagram.com/roseco",
  message: "Hello",
};
const countryReq = {
  kind: "country",
  contactName: "Mehmet",
  email: "mehmet@example.com",
  phone: "+90 555 123 4567",
  country: "TR",
  offering: "Warehouse and couriers",
};

const post = (body: unknown) =>
  request(app)
    .post("/v1/partner-requests")
    .send(body as object);

describe("POST /v1/partner-requests", () => {
  it("stores a brand request with a normalised email and alerts staff without contact data", async () => {
    const res = await post(brand);
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ received: true });

    const docs = await PartnerRequestModel.find().lean();
    expect(docs).toHaveLength(1);
    expect(docs[0]).toMatchObject({ kind: "brand", status: "new", email: "ayesha@example.com" });
    expect(docs[0]?.notes).toEqual([]);

    const alerts = await OutboxModel.find({ type: "staff_alert" }).lean();
    expect(alerts).toHaveLength(1);
    const payload = alerts[0]?.payload as { subject: string; text: string };
    expect(payload.text).toBe(
      "New brand partner request: Rose & Co (Pakistan). Open the admin to read it.",
    );
    const all = JSON.stringify(payload).toLowerCase();
    for (const secret of ["ayesha", "example.com", "300", "instagram"]) {
      expect(all).not.toContain(secret);
    }
  });

  it("stores a country request for a coming-soon country", async () => {
    const res = await post(countryReq);
    expect(res.status).toBe(201);
    const alert = await OutboxModel.findOne({ type: "staff_alert" }).lean();
    expect((alert?.payload as { text: string }).text).toBe(
      "New country request for Turkey. Open the admin to read it.",
    );
    expect(await PartnerRequestModel.countDocuments({ kind: "country" })).toBe(1);
  });

  it("answers a filled honeypot with a fake 201 and stores nothing", async () => {
    const res = await post({ ...brand, [PARTNER_HONEYPOT_FIELD]: "http://spam.example" });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ received: true });
    expect(await PartnerRequestModel.countDocuments()).toBe(0);
    expect(await OutboxModel.countDocuments()).toBe(0);
  });

  it("honeypot answers 201 even when the rest of the body is invalid", async () => {
    const res = await post({ kind: "nope", [PARTNER_HONEYPOT_FIELD]: "x" });
    expect(res.status).toBe(201);
    expect(await PartnerRequestModel.countDocuments()).toBe(0);
  });

  it("treats an empty honeypot as a real request", async () => {
    const res = await post({ ...brand, [PARTNER_HONEYPOT_FIELD]: "" });
    expect(res.status).toBe(201);
    expect(await PartnerRequestModel.countDocuments()).toBe(1);
  });

  it("rejects an unknown kind with 400", async () => {
    const res = await post({ ...brand, kind: "reseller" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects an invalid body with 400", async () => {
    const res = await post({ ...brand, email: "not-an-email", productCategories: [] });
    expect(res.status).toBe(400);
    expect(await PartnerRequestModel.countDocuments()).toBe(0);
  });

  it("rejects an unknown country with 422", async () => {
    const res = await post({ ...brand, country: "ZZ" });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects a country request for a live country with 422", async () => {
    const res = await post({ ...countryReq, country: "PK" });
    expect(res.status).toBe(422);
    expect(await PartnerRequestModel.countDocuments()).toBe(0);
    expect(await OutboxModel.countDocuments()).toBe(0);
  });

  it("limits each IP to 3 requests an hour", async () => {
    for (let i = 0; i < 3; i++) expect((await post(brand)).status).toBe(201);
    const res = await post(brand);
    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe("RATE_LIMITED");
  });
});

describe("staff routes", () => {
  async function seed(): Promise<void> {
    const base = { status: "new" as const, notes: [], message: "" };
    const mk = (n: number, extra: Record<string, unknown>) =>
      PartnerRequestModel.collection.insertOne({
        ...base,
        contactName: "C",
        email: "c@example.com",
        phone: "+92 300 1234567",
        createdAt: new Date(Date.UTC(2026, 0, n)),
        updatedAt: new Date(Date.UTC(2026, 0, n)),
        ...extra,
      });
    await mk(1, {
      kind: "brand",
      country: "PK",
      brandName: "A",
      productCategories: ["x"],
      link: "l",
    });
    await mk(2, {
      kind: "brand",
      country: "PK",
      brandName: "B",
      productCategories: ["x"],
      link: "l",
      status: "in_talks",
    });
    await mk(3, {
      kind: "brand",
      country: "TR",
      brandName: "C",
      productCategories: ["x"],
      link: "l",
      status: "in_talks",
    });
    await mk(4, { kind: "country", country: "TR", offering: "o" });
  }

  it.each([
    ["get", "/v1/partner-requests/admin"],
    ["get", `/v1/partner-requests/admin/${ACTOR}`],
    ["patch", `/v1/partner-requests/admin/${ACTOR}`],
  ] as const)("rejects anonymous %s %s with 401", async (method, url) => {
    const res = await request(app)[method](url).send({ note: "x" });
    expect(res.status).toBe(401);
  });

  it("lists newest first, paginated, in the contract shape", async () => {
    await seed();
    const res = await request(app).get("/v1/partner-requests/admin?pageSize=3").set(asStaff);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ page: 1, pageSize: 3, total: 4 });
    expect(res.body.items.map((i: { createdAt: string }) => i.createdAt.slice(0, 10))).toEqual([
      "2026-01-04",
      "2026-01-03",
      "2026-01-02",
    ]);
    for (const item of res.body.items) {
      expect(() => PartnerRequestSchema.parse(item)).not.toThrow();
      expect(item).not.toHaveProperty("_id");
      expect(item).not.toHaveProperty("__v");
    }
    const page2 = await request(app)
      .get("/v1/partner-requests/admin?pageSize=3&page=2")
      .set(asStaff);
    expect(page2.body.items).toHaveLength(1);
  });

  it("combines kind, status and country filters", async () => {
    await seed();
    const get = (q: string) => request(app).get(`/v1/partner-requests/admin?${q}`).set(asStaff);
    expect((await get("kind=brand")).body.total).toBe(3);
    expect((await get("kind=brand&status=in_talks")).body.total).toBe(2);
    const both = await get("kind=brand&status=in_talks&country=TR");
    expect(both.body.total).toBe(1);
    expect(both.body.items[0].brandName).toBe("C");
    expect((await get("kind=country&status=in_talks")).body.total).toBe(0);
  });

  it("rejects a bad filter with 400", async () => {
    const res = await request(app).get("/v1/partner-requests/admin?status=weird").set(asStaff);
    expect(res.status).toBe(400);
  });

  it("returns a detail and 404 for an unknown id, 400 for a malformed one", async () => {
    await post(brand);
    const { body } = await request(app).get("/v1/partner-requests/admin").set(asStaff);
    const id = body.items[0].id as string;
    const ok = await request(app).get(`/v1/partner-requests/admin/${id}`).set(asStaff);
    expect(ok.status).toBe(200);
    expect(ok.body.email).toBe("ayesha@example.com");
    expect(
      (
        await request(app)
          .get(`/v1/partner-requests/admin/${"b".repeat(24)}`)
          .set(asStaff)
      ).status,
    ).toBe(404);
    expect((await request(app).get("/v1/partner-requests/admin/nope").set(asStaff)).status).toBe(
      400,
    );
  });

  describe("PATCH", () => {
    async function createdId(): Promise<string> {
      await post(brand);
      const doc = await PartnerRequestModel.findOne().lean();
      return String(doc?._id);
    }
    const patch = (id: string, body: unknown) =>
      request(app)
        .patch(`/v1/partner-requests/admin/${id}`)
        .set(asStaff)
        .send(body as object);

    it("changes status and appends a system note with the actor", async () => {
      const id = await createdId();
      const res = await patch(id, { status: "in_talks" });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("in_talks");
      expect(res.body.notes).toHaveLength(1);
      expect(res.body.notes[0]).toMatchObject({
        actorId: ACTOR,
        text: "Status changed from new to in_talks",
      });
      expect(() => PartnerRequestSchema.parse(res.body)).not.toThrow();
    });

    it("allows any status to any other status", async () => {
      const id = await createdId();
      await patch(id, { status: "declined" });
      const res = await patch(id, { status: "new" });
      expect(res.body.status).toBe("new");
      expect(res.body.notes.map((n: { text: string }) => n.text)).toEqual([
        "Status changed from new to declined",
        "Status changed from declined to new",
      ]);
    });

    it("adds a note only, without changing the status", async () => {
      const id = await createdId();
      const res = await patch(id, { note: "  Called them  " });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("new");
      expect(res.body.notes).toHaveLength(1);
      expect(res.body.notes[0]).toMatchObject({ actorId: ACTOR, text: "Called them" });
    });

    it("records the system note before the typed note when both are given", async () => {
      const id = await createdId();
      const res = await patch(id, { status: "accepted", note: "Great fit" });
      expect(res.body.notes.map((n: { text: string }) => n.text)).toEqual([
        "Status changed from new to accepted",
        "Great fit",
      ]);
    });

    it("rejects an empty update with 422", async () => {
      const id = await createdId();
      const res = await patch(id, {});
      expect(res.status).toBe(422);
    });

    it("rejects an invalid status with 400", async () => {
      const id = await createdId();
      expect((await patch(id, { status: "maybe" })).status).toBe(400);
    });

    it("answers 404 for an unknown id and 400 for a malformed one", async () => {
      expect((await patch("c".repeat(24), { note: "x" })).status).toBe(404);
      expect((await patch("nope", { note: "x" })).status).toBe(400);
    });
  });
});

describe("partner request hardening", () => {
  it("rejects a brand link that is not a web address or an Instagram handle", async () => {
    for (const link of [
      "javascript:alert(1)",
      "data:text/html,x",
      "ftp://x.example",
      "two words",
    ]) {
      resetPartnerRateLimit();
      expect((await post({ ...brand, link })).status, link).toBe(400);
    }
    for (const link of [
      "https://good.example/shop",
      "http://good.example",
      "@honeybloom",
      "honey.bloom",
      "instagram.com/honeybloom",
      "www.honeybloom.example",
    ]) {
      resetPartnerRateLimit();
      expect((await post({ ...brand, link })).status, link).toBe(201);
    }
  });

  it("keeps line breaks and control characters out of the alert sent to staff", () => {
    const alert = alertFor(
      { ...brand, kind: "brand" as const, brandName: "Evil\r\nSubject: hacked\u0000" },
      "Pakistan",
    );
    expect(alert.text).not.toMatch(/\p{Cc}/u);
    expect(alert.text).toContain("Evil Subject: hacked");
  });

  it("answers 500 INTERNAL, not 400, when a stored row no longer parses", async () => {
    await PartnerRequestModel.collection.insertOne({
      kind: "brand",
      brandName: "x".repeat(300),
      contactName: "A",
      email: "a@example.com",
      phone: "+92 300 1234567",
      country: "PK",
      productCategories: ["candles"],
      link: "https://x.example",
      message: "",
      status: "new",
      notes: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const res = await request(app).get("/v1/partner-requests/admin").set(asStaff);
    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("INTERNAL");
  });
});
