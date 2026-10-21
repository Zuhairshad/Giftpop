import { MemoryStore } from "express-rate-limit";
import request from "supertest";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createTestApp } from "../../../test/app";
import { clearDatabase, useTestMongo } from "../../../test/mongo";
import { makeCountry } from "../countries/fixtures";
import { upsertCountry } from "../countries/service";
import { OutboxModel } from "../notifications/model";
import { processOutbox } from "../notifications/service";
import { registerEmailTransport, unregisterTransport } from "../notifications/transports";
import { initCatalogModels } from "../quotes/fixtures";

import { orderDocInput } from "./fixtures";
import { OrderModel } from "./model";
import { createOrdersRouter } from "./router";

useTestMongo();
beforeAll(initCatalogModels);

const sent: { to: string; subject: string; text: string }[] = [];

beforeEach(async () => {
  await clearDatabase();
  lookupStore.resetAll();
  sent.length = 0;
  registerEmailTransport({
    async send(message) {
      sent.push(message);
    },
  });
  await upsertCountry(makeCountry());
});
afterEach(() => unregisterTransport("email"));

const lookupStore = new MemoryStore();
const app = createTestApp([{ path: "/orders", router: createOrdersRouter({ lookupStore }) }]);
const lookup = (payload: unknown) =>
  request(app)
    .post("/v1/orders/lookup")
    .send(payload as object);

async function seed(number: string, email = "sara@example.com", phone = "+92 300 1234567") {
  const input = orderDocInput({ number });
  return OrderModel.create({ ...input, contact: { ...input.contact, email, phone } });
}

describe("POST /v1/orders/lookup", () => {
  it("emails the order numbers and links for an email that has orders", async () => {
    await seed("GP-PK-AAAAAA");
    await seed("GP-PK-BBBBBB");
    const res = await lookup({ contact: " Sara@Example.com " });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
    await processOutbox({ trackBaseUrl: "https://shop.example" });
    expect(sent).toHaveLength(1);
    expect(sent[0]?.to).toBe("sara@example.com");
    expect(sent[0]?.text).toContain("GP-PK-AAAAAA: https://shop.example/track?number=GP-PK-AAAAAA");
    expect(sent[0]?.text).toContain("GP-PK-BBBBBB");
  });

  it("finds orders by phone, national form included, and emails the address on file", async () => {
    await seed("GP-PK-AAAAAA");
    await lookup({ contact: "0300 1234567" });
    await processOutbox();
    expect(sent.map((m) => m.to)).toEqual(["sara@example.com"]);
  });

  it("answers the same and sends nothing when there is no match", async () => {
    await seed("GP-PK-AAAAAA");
    const res = await lookup({ contact: "nobody@example.com" });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(await OutboxModel.countDocuments({ type: "order_lookup" })).toBe(0);
  });

  it("does not match a short phone tail", async () => {
    await seed("GP-PK-AAAAAA");
    await lookup({ contact: "4567" });
    expect(await OutboxModel.countDocuments({ type: "order_lookup" })).toBe(0);
  });

  it("emails an address at most once in ten minutes", async () => {
    await seed("GP-PK-AAAAAA");
    await lookup({ contact: "sara@example.com" });
    await lookup({ contact: "sara@example.com" });
    expect(await OutboxModel.countDocuments({ type: "order_lookup" })).toBe(1);
  });

  it("queues nothing when no email provider is registered", async () => {
    unregisterTransport("email");
    await seed("GP-PK-AAAAAA");
    const res = await lookup({ contact: "sara@example.com" });
    expect(res.status).toBe(200);
    expect(await OutboxModel.countDocuments({ type: "order_lookup" })).toBe(0);
  });

  it("rejects a missing contact with 400", async () => {
    expect((await lookup({})).status).toBe(400);
    expect((await lookup({ contact: "a" })).status).toBe(400);
  });

  it("is rate limited", async () => {
    for (let i = 0; i < 3; i += 1)
      expect((await lookup({ contact: "x@example.com" })).status).toBe(200);
    expect((await lookup({ contact: "x@example.com" })).status).toBe(429);
  });
});
