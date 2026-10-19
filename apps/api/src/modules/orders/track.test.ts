import { PublicOrderViewSchema } from "@giftpop/contracts";
import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createTestApp } from "../../../test/app";
import { clearDatabase, useTestMongo } from "../../../test/mongo";
import { makeCountry } from "../countries/fixtures";
import { upsertCountry } from "../countries/service";
import { initCatalogModels } from "../quotes/fixtures";
import { createIpLimiter } from "../quotes/rate-limit";

import { orderDocInput } from "./fixtures";
import { OrderModel } from "./model";
import { resetTrackRateLimit } from "./rate-limit";
import { createOrdersRouter } from "./router";

useTestMongo();
beforeAll(initCatalogModels);
beforeEach(async () => {
  await clearDatabase();
  resetTrackRateLimit();
  await upsertCountry(makeCountry());
});

const app = createTestApp([{ path: "/orders", router: createOrdersRouter() }]);
const track = (payload: unknown) =>
  request(app)
    .post("/v1/orders/track")
    .send(payload as object);

async function seedOrder() {
  return OrderModel.create(
    orderDocInput({
      number: "GP-PK-7K2M9Q",
      history: [
        { from: null, to: "awaiting_payment", at: new Date(), actorId: null },
        {
          from: "awaiting_payment",
          to: "confirmed",
          at: new Date(),
          actorId: new (await import("mongoose")).Types.ObjectId(),
          note: "STAFF-SECRET-NOTE",
        },
      ],
      status: "confirmed",
      payments: [
        {
          kind: "advance",
          method: "bank_transfer",
          amount: { amountMinor: 41_000, currency: "PKR" },
          reference: "REF-INTERNAL",
          recordedBy: new (await import("mongoose")).Types.ObjectId(),
          recordedAt: new Date(),
        } as never,
      ],
    }),
  );
}

describe("POST /v1/orders/track", () => {
  it("returns the public view for the phone in a different format", async () => {
    await seedOrder();
    const res = await track({ number: "gp-pk-7k2m9q", contact: "923001234567" });
    expect(res.status).toBe(200);
    const view = PublicOrderViewSchema.parse(res.body);
    expect(view.number).toBe("GP-PK-7K2M9Q");
    expect(view.paymentInstructions).toBe("Bank: 1234 5678 (DEV ONLY)");
    expect(view.history.map((h) => Object.keys(h).sort())).toEqual([
      ["at", "to"],
      ["at", "to"],
    ]);
  });

  it("works with the email in any case", async () => {
    await seedOrder();
    const res = await track({ number: "GP-PK-7K2M9Q", contact: " SARA@Example.com " });
    expect(res.status).toBe(200);
  });

  it("hides staff notes, actor ids, payment records and internal ids", async () => {
    await seedOrder();
    const res = await track({ number: "GP-PK-7K2M9Q", contact: "sara@example.com" });
    const text = JSON.stringify(res.body);
    expect(text).not.toContain("STAFF-SECRET-NOTE");
    expect(text).not.toContain("REF-INTERNAL");
    expect(text).not.toContain("actorId");
    expect(text).not.toContain("recordedBy");
    expect(res.body).not.toHaveProperty("payments");
    expect(res.body).not.toHaveProperty("id");
    expect(res.body).not.toHaveProperty("_id");
    expect(res.body).not.toHaveProperty("contact");
  });

  it("answers a wrong contact exactly like an unknown number", async () => {
    await seedOrder();
    const wrong = await track({ number: "GP-PK-7K2M9Q", contact: "+92 311 0000000" });
    const unknown = await track({ number: "GP-PK-AAAAAA", contact: "+92 300 1234567" });
    expect(wrong.status).toBe(404);
    expect(unknown.status).toBe(404);
    expect(wrong.body).toEqual(unknown.body);
    expect(wrong.body.error.code).toBe("NOT_FOUND");
  });

  it("answers 400 for a malformed number or missing contact", async () => {
    expect((await track({ number: "nope", contact: "sara@example.com" })).status).toBe(400);
    expect((await track({ number: "GP-PK-7K2M9Q" })).status).toBe(400);
  });

  it("answers 429 after ten lookups from one IP in a minute", async () => {
    const limited = createTestApp([
      { path: "/orders", router: createOrdersRouter({ limiter: createIpLimiter({ limit: 10 }) }) },
    ]);
    const send = () =>
      request(limited)
        .post("/v1/orders/track")
        .send({ number: "GP-PK-AAAAAA", contact: "sara@example.com" });
    for (let i = 0; i < 10; i += 1) expect((await send()).status).toBe(404);
    const res = await send();
    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe("RATE_LIMITED");
  });
});
