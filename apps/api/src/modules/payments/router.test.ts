import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { PaymentProofUploadResponseSchema } from "@giftpop/contracts";
import type { Express } from "express";
import sharp from "sharp";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createTestApp } from "../../../test/app";
import { clearDatabase, useTestMongo } from "../../../test/mongo";
import { LocalStorage } from "../../lib/storage";
import { insertOrder, orderDocInput } from "../orders/fixtures";
import { OrderModel } from "../orders/model";
import { createIpLimiter } from "../quotes/rate-limit";

import { createPaymentsRouter } from "./router";

useTestMongo();

let dir: string;
let app: Express;

function buildApp(limit = 1000): Express {
  const storage = new LocalStorage({ rootDir: dir, publicBaseUrl: "http://assets.test/files" });
  return createTestApp([
    {
      path: "/orders",
      router: createPaymentsRouter({
        limiter: createIpLimiter({ limit, store: undefined }),
        resolveStorage: () => storage,
      }),
    },
  ]);
}

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), "giftpop-proofs-"));
  app = buildApp();
});
afterAll(async () => {
  await rm(dir, { recursive: true, force: true });
});
beforeEach(clearDatabase);

const png = () =>
  sharp({ create: { width: 40, height: 30, channels: 3, background: "#336699" } })
    .png()
    .toBuffer();

async function orderWithNumber(
  number = "GP-PK-ABC234",
  status: Parameters<typeof insertOrder>[0] = "awaiting_payment",
) {
  await insertOrder(status, { number });
  return number;
}

function post(number: string, contact: string | undefined, file: Buffer, name = "p.png") {
  const req = request(app).post(`/v1/orders/${number}/payment-proof`);
  if (contact !== undefined) req.field("contact", contact);
  return req.attach("file", file, { filename: name, contentType: "image/png" });
}

describe("POST /v1/orders/:number/payment-proof", () => {
  it("stores a WebP proof and answers 201 with the contract shape", async () => {
    const number = await orderWithNumber();
    const res = await post(number, "sara@example.com", await png());
    expect(res.status).toBe(201);
    const body = PaymentProofUploadResponseSchema.parse(res.body);
    expect(body.proof.status).toBe("pending");
    const stored = await OrderModel.findOne({ number }).lean();
    expect(stored?.proofs).toHaveLength(1);
    expect(stored?.proofs[0]?.url).toMatch(/^http:\/\/assets\.test\/files\/proofs\/[\w-]+\.webp$/);
    expect(stored?.status).toBe("awaiting_payment");
  });

  it("accepts a lowercase number and a phone typed in another format", async () => {
    await orderWithNumber();
    const res = await post("gp-pk-abc234", "0092 300-1234567".replace("0092", "+92"), await png());
    expect(res.status).toBe(201);
  });

  it("answers a wrong contact exactly like an unknown number", async () => {
    const number = await orderWithNumber();
    const wrong = await post(number, "nobody@example.com", await png());
    const unknown = await post("GP-PK-ZZZZZZ", "sara@example.com", await png());
    expect(wrong.status).toBe(404);
    expect(unknown.status).toBe(404);
    expect(wrong.body).toEqual(unknown.body);
    expect((await OrderModel.findOne({ number }).lean())?.proofs).toHaveLength(0);
  });

  it("rejects a request without contact", async () => {
    const number = await orderWithNumber();
    const res = await post(number, undefined, await png());
    expect(res.status).toBe(400);
  });

  it("rejects extra form fields", async () => {
    const number = await orderWithNumber();
    const res = await request(app)
      .post(`/v1/orders/${number}/payment-proof`)
      .field("contact", "sara@example.com")
      .field("status", "accepted")
      .attach("file", await png(), { filename: "p.png", contentType: "image/png" });
    expect(res.status).toBe(400);
  });

  it("rejects a file that is not a PNG, WebP or JPEG with 415", async () => {
    const number = await orderWithNumber();
    const res = await post(number, "sara@example.com", Buffer.from("%PDF-1.4 hello"), "p.png");
    expect(res.status).toBe(415);
  });

  it("rejects a file over 5 MB with 413", async () => {
    const number = await orderWithNumber();
    const big = Buffer.concat([await png(), Buffer.alloc(5 * 1024 * 1024 + 10)]);
    const res = await post(number, "sara@example.com", big);
    expect(res.status).toBe(413);
  });

  it("allows at most 5 proofs per order", async () => {
    const number = await orderWithNumber();
    const file = await png();
    for (let i = 0; i < 5; i++) {
      expect((await post(number, "sara@example.com", file)).status).toBe(201);
    }
    const sixth = await post(number, "sara@example.com", file);
    expect(sixth.status).toBe(409);
    expect(sixth.body.error.code).toBe("CONFLICT");
    expect((await OrderModel.findOne({ number }).lean())?.proofs).toHaveLength(5);
  });

  it("only accepts a proof while awaiting payment", async () => {
    const number = await orderWithNumber("GP-PK-CONF22", "confirmed");
    const res = await post(number, "sara@example.com", await png());
    expect(res.status).toBe(409);
  });

  it("is rate limited per IP", async () => {
    const limited = buildApp(2);
    const number = await orderWithNumber();
    const file = await png();
    const send = () =>
      request(limited)
        .post(`/v1/orders/${number}/payment-proof`)
        .field("contact", "sara@example.com")
        .attach("file", file, { filename: "p.png", contentType: "image/png" });
    expect((await send()).status).toBe(201);
    expect((await send()).status).toBe(201);
    const third = await send();
    expect(third.status).toBe(429);
    expect(third.body.error.code).toBe("RATE_LIMITED");
  });
});

describe("fixtures sanity", () => {
  it("orderDocInput contact matches the contact used above", () => {
    expect(orderDocInput().contact.email).toBe("sara@example.com");
  });
});
