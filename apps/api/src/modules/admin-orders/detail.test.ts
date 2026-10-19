import { AdminOrderDetailSchema } from "@giftpop/contracts";
import { Types } from "mongoose";
import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createTestApp } from "../../../test/app";
import { clearDatabase, useTestMongo } from "../../../test/mongo";
import { insertOrder, orderDocInput } from "../orders/fixtures";
import { OrderModel } from "../orders/model";
import { createOrdersRouter } from "../orders/router";
import { StaffModel } from "../staff/model";

import { api, createAdminApp, signIn, type StaffSession } from "./admin-orders.test-utils";

useTestMongo();
beforeAll(async () => {
  await OrderModel.init();
});

const app = createAdminApp();
let session: StaffSession;
beforeEach(async () => {
  await clearDatabase();
  session = await signIn(app);
});

describe("GET /:id", () => {
  it("returns the full order with actor names, null for a deleted account", async () => {
    const gone = new Types.ObjectId();
    const id = await insertOrder("confirmed", {
      history: [
        { from: null, to: "awaiting_payment", at: new Date(), actorId: null },
        { from: "awaiting_payment", to: "confirmed", at: new Date(), actorId: gone },
      ],
    });
    await api(app, session).post(`/${id}/notes`, { text: "Call before delivery" });
    const res = await api(app, session).get(`/${id}`);
    expect(res.status).toBe(200);
    expect(() => AdminOrderDetailSchema.parse(res.body)).not.toThrow();
    expect(res.body.history[1].actorName).toBeNull();
    expect(res.body.notes[0]).toMatchObject({ actorId: session.id, actorName: "Amina Staff" });
    expect(res.body.design.items).toHaveLength(1);
    expect(res.body.items[0].name).toBe("Dark chocolate bar");
  });

  it("answers 404 for an unknown order and 400 for a malformed id", async () => {
    expect((await api(app, session).get(`/${"c".repeat(24)}`)).status).toBe(404);
    expect((await api(app, session).get("/12345")).status).toBe(400);
  });
});

describe("POST /:id/payments", () => {
  it("records through recordPayment and confirms the order via the state machine", async () => {
    const id = await insertOrder("awaiting_payment");
    const res = await api(app, session).post(`/${id}/payments`, {
      kind: "advance",
      method: "manual_transfer",
      amountMinor: 41_000,
      reference: "TX-1",
      currency: "USD",
    });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("confirmed");
    expect(res.body.paymentStatus).toBe("advance_paid");
    expect(res.body.payments[0]).toMatchObject({
      amount: { amountMinor: 41_000, currency: "PKR" },
      reference: "TX-1",
      recordedBy: session.id,
      recordedByName: "Amina Staff",
    });
    expect(res.body.history.at(-1)).toMatchObject({ to: "confirmed", actorId: session.id });
  });

  it("answers 400 for a bad amount, 404 for an unknown order", async () => {
    const id = await insertOrder("awaiting_payment");
    const bad = { kind: "advance", method: "manual_transfer" };
    expect(
      (await api(app, session).post(`/${id}/payments`, { ...bad, amountMinor: 0 })).status,
    ).toBe(400);
    expect(
      (await api(app, session).post(`/${id}/payments`, { ...bad, amountMinor: 1.5 })).status,
    ).toBe(400);
    expect(
      (await api(app, session).post(`/${id}/payments`, { ...bad, kind: "x", amountMinor: 5 }))
        .status,
    ).toBe(400);
    const unknown = await api(app, session).post(`/${"c".repeat(24)}/payments`, {
      ...bad,
      amountMinor: 5,
    });
    expect(unknown.status).toBe(404);
  });
});

describe("POST /:id/notes", () => {
  it("adds a note and never shows it on the public tracking view", async () => {
    const id = await insertOrder("confirmed", { number: "GP-PK-7K2M9Q" });
    const res = await api(app, session).post(`/${id}/notes`, { text: "Secret staff remark" });
    expect(res.status).toBe(200);
    expect(res.body.notes).toHaveLength(1);

    const publicApp = createTestApp([{ path: "/orders", router: createOrdersRouter() }]);
    const tracked = await request(publicApp)
      .post("/v1/orders/track")
      .send({ number: "GP-PK-7K2M9Q", contact: "sara@example.com" });
    expect(tracked.status).toBe(200);
    expect(JSON.stringify(tracked.body)).not.toContain("Secret staff remark");
    expect(tracked.body).not.toHaveProperty("notes");
  });

  it("keeps both notes when two arrive together", async () => {
    const id = await insertOrder("confirmed");
    await Promise.all([
      api(app, session).post(`/${id}/notes`, { text: "one" }),
      api(app, session).post(`/${id}/notes`, { text: "two" }),
    ]);
    expect((await OrderModel.findById(id).lean())?.notes).toHaveLength(2);
  });

  it("answers 400 for empty text or a bad id and 404 for an unknown order", async () => {
    const id = await insertOrder("confirmed");
    expect((await api(app, session).post(`/${id}/notes`, { text: "   " })).status).toBe(400);
    expect((await api(app, session).post("/zzz/notes", { text: "x" })).status).toBe(400);
    expect((await api(app, session).post(`/${"c".repeat(24)}/notes`, { text: "x" })).status).toBe(
      404,
    );
  });
});

describe("PATCH /:id/proofs/:proofId", () => {
  async function withProof() {
    const proofId = new Types.ObjectId();
    const other = new Types.ObjectId();
    const doc = await OrderModel.create(
      orderDocInput({
        proofs: [
          { _id: proofId, url: "https://x/a.webp", status: "pending", uploadedAt: new Date() },
          { _id: other, url: "https://x/b.webp", status: "pending", uploadedAt: new Date() },
        ],
      }),
    );
    return {
      id: doc._id.toHexString(),
      proofId: proofId.toHexString(),
      other: other.toHexString(),
    };
  }

  it("reviews only the named proof", async () => {
    const { id, proofId } = await withProof();
    const res = await api(app, session).patch(`/${id}/proofs/${proofId}`, { status: "accepted" });
    expect(res.status).toBe(200);
    expect(res.body.proofs.map((p: { status: string }) => p.status)).toEqual([
      "accepted",
      "pending",
    ]);
    expect(res.body.proofs[0].url).toBe("https://x/a.webp");
  });

  it("can reject, and 404s for an unknown proof or order", async () => {
    const { id, other } = await withProof();
    const rejected = await api(app, session).patch(`/${id}/proofs/${other}`, {
      status: "rejected",
    });
    expect(rejected.body.proofs[1].status).toBe("rejected");
    const unknownProof = await api(app, session).patch(`/${id}/proofs/${"d".repeat(24)}`, {
      status: "accepted",
    });
    expect(unknownProof.status).toBe(404);
    const unknownOrder = await api(app, session).patch(`/${"d".repeat(24)}/proofs/${other}`, {
      status: "accepted",
    });
    expect(unknownOrder.status).toBe(404);
  });

  it("answers 400 for a bad status or ids", async () => {
    const { id, proofId } = await withProof();
    expect(
      (await api(app, session).patch(`/${id}/proofs/${proofId}`, { status: "pending" })).status,
    ).toBe(400);
    expect(
      (await api(app, session).patch(`/${id}/proofs/nope`, { status: "accepted" })).status,
    ).toBe(400);
  });
});

describe("staff accounts", () => {
  it("rejects a deactivated account's session", async () => {
    await StaffModel.updateOne({ _id: session.id }, { active: false });
    expect((await api(app, session).get("/")).status).toBe(401);
  });
});
