import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { resetLoginIpRateLimit } from "../../src/middleware/login-ip-limit";
import { loginAs, seedStaff } from "../../src/modules/auth/auth.test-utils";
import { resetLoginRateLimit } from "../../src/modules/auth/rate-limit";
import { makeCountry } from "../../src/modules/countries/fixtures";
import { CountryModel } from "../../src/modules/countries/model";
import { OrderModel } from "../../src/modules/orders/model";
import { PartnerRequestModel } from "../../src/modules/partners/model";
import {
  initCatalogModels,
  makeDesign,
  seedWorld,
  type World,
} from "../../src/modules/quotes/fixtures";
import { StaffModel } from "../../src/modules/staff/model";
import { createTestApp } from "../app";
import { clearDatabase, useTestMongo } from "../mongo";

useTestMongo();
beforeAll(initCatalogModels);
beforeEach(async () => {
  await clearDatabase();
  resetLoginRateLimit();
  resetLoginIpRateLimit();
});

const app = createTestApp();

async function orderBody(world: World, extra: Record<string, unknown>) {
  return {
    country: "PK",
    design: makeDesign(world.packaging, [
      [world.bar, 2],
      [world.soap, 1],
    ]),
    contact: { name: "Sara Khan", email: "sara@example.com", phone: "+92 300 1234567" },
    address: { line1: "12 Garden Road", city: "Lahore", region: "Punjab" },
    paymentMode: "cod",
    ...extra,
  };
}

describe("POST /v1/orders ignores fields the client has no right to set", () => {
  it("keeps status, payment state, history, number, shipment, payments and totals server-owned", async () => {
    const world = await seedWorld();
    const res = await request(app)
      .post("/v1/orders")
      .set("Idempotency-Key", "mass-assign-key-0001")
      .send(
        await orderBody(world, {
          status: "delivered",
          paymentStatus: "paid",
          number: "GP-PK-HACKED",
          history: [{ from: null, to: "delivered", at: "2020-01-01T00:00:00.000Z", actorId: null }],
          shipment: { courier: "Me", trackingNumber: "1" },
          payments: [{ amountMinor: 999_999, method: "cash", kind: "payment" }],
          proofs: [{ url: "https://evil.example/x.png", status: "approved" }],
          notes: [{ text: "free gift" }],
          totalMinor: 1,
          quote: { totalMinor: 1, dueNowMinor: 0 },
          items: [{ itemId: world.bar.id, name: "Free", unitPriceMinor: 1, qty: 1 }],
          packaging: { name: "Free", priceMinor: 1 },
          _id: "0".repeat(24),
          __v: 99,
        }),
      );
    expect(res.status).toBe(201);

    const order = await OrderModel.findOne().lean();
    expect(order?.status).toBe("awaiting_payment");
    expect(order?.paymentStatus).toBe("unpaid");
    expect(order?.number).not.toBe("GP-PK-HACKED");
    expect(order?.history).toHaveLength(1);
    expect(order?.history[0]?.to).toBe("awaiting_payment");
    expect(order?.shipment).toBeNull();
    expect(order?.payments).toEqual([]);
    expect(order?.proofs).toEqual([]);
    expect(order?.notes).toEqual([]);
    expect(order?._id.toHexString()).not.toBe("0".repeat(24));
    expect(order?.quote.totalMinor).toBe(217_000);
    expect(order?.items.map((line) => line.name).sort()).toEqual(["Bar", "Soap"]);
    expect(order?.packaging.name).toBe("Box");
  });
});

describe("POST /v1/partner-requests", () => {
  it("cannot set its own status or notes", async () => {
    await CountryModel.create(
      makeCountry({ code: "TR", name: "Turkey", currency: "TRY", status: "coming_soon" }),
    );
    await request(app)
      .post("/v1/partner-requests")
      .send({
        kind: "country",
        contactName: "Ayesha Khan",
        email: "ayesha@example.com",
        phone: "+92 300 1234567",
        country: "TR",
        offering: "I can run the launch",
        status: "accepted",
        notes: [{ at: "2020-01-01T00:00:00.000Z", actorId: "a".repeat(24), text: "approved" }],
        _id: "b".repeat(24),
      })
      .expect(201);
    const doc = await PartnerRequestModel.findOne().lean();
    expect(doc?.status).toBe("new");
    expect(doc?.notes).toEqual([]);
    expect(doc?._id.toHexString()).not.toBe("b".repeat(24));
  });
});

describe("staff routes", () => {
  it("PATCH /v1/staff/:id cannot write passwordHash, email or _id", async () => {
    await seedStaff({ email: "owner@giftpop.test", role: "owner" });
    const target = await seedStaff({ email: "worker@giftpop.test", role: "staff" });
    const before = await StaffModel.findById(target.id).lean();
    const cookie = await loginAs(app, "owner@giftpop.test");

    const res = await request(app)
      .patch(`/v1/staff/${target.id}`)
      .set("Cookie", cookie)
      .send({
        name: "Renamed",
        passwordHash: "$argon2id$attacker",
        email: "attacker@evil.example",
        _id: "c".repeat(24),
      });
    expect(res.status).toBe(200);
    const after = await StaffModel.findById(target.id).lean();
    expect(after?.name).toBe("Renamed");
    expect(after?.passwordHash).toBe(before?.passwordHash);
    expect(after?.email).toBe("worker@giftpop.test");
    expect(res.text).not.toMatch(/passwordHash|argon2/);
  });

  it("POST /v1/staff never returns the password hash and ignores an injected id", async () => {
    await seedStaff({ email: "owner@giftpop.test", role: "owner" });
    const cookie = await loginAs(app, "owner@giftpop.test");
    const res = await request(app)
      .post("/v1/staff")
      .set("Cookie", cookie)
      .send({
        email: "new@giftpop.test",
        name: "New",
        role: "staff",
        password: "a long password",
        active: false,
        _id: "d".repeat(24),
      });
    expect(res.status).toBe(201);
    expect(res.text).not.toMatch(/passwordHash|argon2|a long password/);
    const created = await StaffModel.findOne({ email: "new@giftpop.test" }).lean();
    expect(created?._id.toHexString()).not.toBe("d".repeat(24));
    expect(created?.active).toBe(true);
  });
});
