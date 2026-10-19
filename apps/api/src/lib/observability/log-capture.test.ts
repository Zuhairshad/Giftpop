import { Writable } from "node:stream";

import { Router } from "express";
import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { clearDatabase, useTestMongo } from "../../../test/mongo";
import { createApp } from "../../app";
import { parseEnv } from "../../env";
import { createLogger } from "../../logger";
import { loginAs, seedStaff } from "../../modules/auth/auth.test-utils";
import { resetLoginRateLimit } from "../../modules/auth/rate-limit";
import { authRouter } from "../../modules/auth/router";
import { makeCountry } from "../../modules/countries/fixtures";
import { upsertCountry } from "../../modules/countries/service";
import { orderDocInput } from "../../modules/orders/fixtures";
import { OrderModel } from "../../modules/orders/model";
import { resetTrackRateLimit } from "../../modules/orders/rate-limit";
import { createOrdersRouter } from "../../modules/orders/router";
import { initCatalogModels, makeDesign, seedWorld } from "../../modules/quotes/fixtures";
import { AppError } from "../errors";

import { getRequestId } from "./context";

useTestMongo();
beforeAll(initCatalogModels);

const lines: string[] = [];
const stream = new Writable({
  write(chunk: Buffer, _encoding, callback) {
    lines.push(...chunk.toString().split("\n").filter(Boolean));
    callback();
  },
});

const env = parseEnv({
  NODE_ENV: "development",
  LOG_LEVEL: "debug",
  MONGODB_URI: "mongodb://localhost:27017/giftpop_test",
});
const logger = createLogger(env, stream);

const extra = Router();
extra.get("/fail", () => {
  throw new Error("could not process sara@example.com or +92 300 1234567");
});
extra.get("/app-error", () => {
  throw new AppError("FORBIDDEN", 403, "no for sara@example.com");
});
extra.get("/service-log", async (_req, res) => {
  await Promise.resolve();
  // A service logging with the plain app logger still carries the request id.
  logger.info({ requestIdSeen: getRequestId(), phone: "+92 300 1234567" }, "service step");
  res.json({ ok: true });
});

const app = createApp({
  env,
  logger,
  modules: [
    { path: "/auth", router: authRouter },
    { path: "/orders", router: createOrdersRouter({ orderLimiter: (_req, _res, next) => next() }) },
    { path: "/test", router: extra },
  ],
});

const RAW_LEAKS = [
  "sara@example.com",
  "owner@giftpop.test",
  "leak@example.com",
  "+92 300 1234567",
  "300 1234567",
  "3001234567",
  "923001234567",
  "Garden Road",
  "Happy birthday",
  "correct horse battery",
];

function parsedLines(): Record<string, unknown>[] {
  return lines.map((line) => JSON.parse(line) as Record<string, unknown>);
}

function expectClean(): void {
  const text = lines.join("\n");
  for (const leak of RAW_LEAKS) expect(text, `log leaked ${leak}`).not.toContain(leak);
  for (const entry of parsedLines()) {
    expect(typeof entry.requestId, `no request id on ${JSON.stringify(entry)}`).toBe("string");
  }
}

beforeEach(async () => {
  lines.length = 0;
  resetLoginRateLimit();
  resetTrackRateLimit();
  await clearDatabase();
});

describe("request logging", () => {
  it("logs an order placement without contact details and with the request id on every line", async () => {
    const world = await seedWorld();
    const res = await request(app)
      .post("/v1/orders?ref=leak@example.com")
      .set("Idempotency-Key", "log-test-key-0001")
      .set("X-Request-Id", "req-order-1")
      .send({
        country: "PK",
        design: makeDesign(world.packaging, [[world.bar, 2]]),
        contact: { name: "Sara Khan", email: "sara@example.com", phone: "+92 300 1234567" },
        address: { line1: "12 Garden Road", city: "Lahore", region: "Punjab" },
        paymentMode: "cod",
      });
    expect(res.status).toBe(201);
    expect(res.headers["x-request-id"]).toBe("req-order-1");

    expectClean();
    const access = parsedLines().filter((entry) => entry.msg === "request completed");
    expect(access).toHaveLength(1);
    expect(access[0]).toMatchObject({
      requestId: "req-order-1",
      method: "POST",
      route: "/v1/orders",
      status: 201,
    });
    expect(typeof access[0]?.durationMs).toBe("number");
    expect(JSON.stringify(access[0])).not.toContain("ref=");
  });

  it("logs a login without the email or password", async () => {
    await seedStaff();
    await loginAs(app, "owner@giftpop.test");
    await request(app)
      .post("/v1/auth/login")
      .send({ email: "owner@giftpop.test", password: "correct horse battery wrong" });
    expect(lines.length).toBeGreaterThanOrEqual(2);
    expectClean();
  });

  it("logs a track lookup without the phone", async () => {
    await upsertCountry(makeCountry());
    await OrderModel.create(orderDocInput({ number: "GP-PK-7K2M9Q" }));
    const ok = await request(app)
      .post("/v1/orders/track")
      .send({ number: "GP-PK-7K2M9Q", contact: "+92 300 1234567" });
    expect(ok.status).toBe(200);
    expectClean();
    const access = parsedLines().find((entry) => entry.msg === "request completed");
    expect(access).toMatchObject({ route: "/v1/orders/track", status: 200 });
  });

  it("masks input that an error message echoes, and logs the request id with it", async () => {
    const res = await request(app).get("/v1/test/fail?email=leak@example.com");
    expect(res.status).toBe(500);
    expectClean();
    const text = lines.join("\n");
    expect(text).toContain("Unhandled error");
    expect(text).toContain("[email]");
    expect(text).toContain("[phone]");
  });

  it("keeps the request id on service-level logs and masks their fields", async () => {
    const res = await request(app).get("/v1/test/service-log").set("X-Request-Id", "svc_42");
    expect(res.status).toBe(200);
    expectClean();
    const service = parsedLines().find((entry) => entry.msg === "service step");
    expect(service).toMatchObject({
      requestId: "svc_42",
      requestIdSeen: "svc_42",
      phone: "[redacted]",
    });
    expect(Object.keys(service ?? {}).filter((key) => key === "requestId")).toHaveLength(1);
  });

  it("logs 4xx at warn and an unmatched route by pattern", async () => {
    const res = await request(app).get("/v1/nope/12345678901");
    expect(res.status).toBe(404);
    const access = parsedLines().find((entry) => entry.msg === "request completed");
    expect(access).toMatchObject({ level: 40, route: "unmatched", status: 404 });
    expect(JSON.stringify(access)).not.toContain("12345678901");
  });

  it("replaces an unsafe incoming request id and generates one when absent", async () => {
    const unsafe = await request(app).get("/health").set("X-Request-Id", "bad id with spaces!");
    expect(unsafe.headers["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/);
    const tooLong = await request(app).get("/health").set("X-Request-Id", "a".repeat(65));
    expect(tooLong.headers["x-request-id"]).not.toBe("a".repeat(65));
    const none = await request(app).get("/health");
    expect(none.headers["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/);
    const ok = await request(app).get("/health").set("X-Request-Id", "a".repeat(64));
    expect(ok.headers["x-request-id"]).toBe("a".repeat(64));
  });

  it("keeps the generated request id intact (digits are not mistaken for a phone)", async () => {
    const res = await request(app).get("/v1/test/service-log");
    const id = res.headers["x-request-id"];
    expect(parsedLines().every((entry) => entry.requestId === id)).toBe(true);
  });
});
