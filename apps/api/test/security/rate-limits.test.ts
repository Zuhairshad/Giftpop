import { ErrorResponseSchema } from "@giftpop/contracts";
import request from "supertest";
import { describe, expect, it } from "vitest";

import {
  LOGIN_REQUESTS_PER_IP_PER_MINUTE,
  resetLoginIpRateLimit,
} from "../../src/middleware/login-ip-limit";
import { resetLoginRateLimit } from "../../src/modules/auth/rate-limit";
import { createTestApp } from "../app";
import { useTestMongo } from "../mongo";

/**
 * Every public POST must be rate limited and answer 429 in the standard error shape.
 * Each case sends bodies that fail validation, so no business logic runs: the limiter
 * sits before (or, for login, right after) validation and counts them anyway. A new
 * public POST is caught by `admin-routes.test.ts` (it must be added to the public table)
 * and should be added here.
 */

useTestMongo(); // login looks the email up before it can answer 401
const app = createTestApp();

interface Case {
  name: string;
  limit: number;
  send: () => request.Test;
  /** Status of a request inside the limit (anything but 429 is fine; this pins it). */
  inside: number;
}

const cases: Case[] = [
  {
    name: "POST /v1/orders",
    limit: 20,
    send: () => request(app).post("/v1/orders").send({}),
    inside: 400,
  },
  {
    name: "POST /v1/orders/track",
    limit: 10,
    send: () => request(app).post("/v1/orders/track").send({}),
    inside: 400,
  },
  {
    name: "POST /v1/orders/lookup",
    limit: 3,
    send: () => request(app).post("/v1/orders/lookup").send({}),
    inside: 400,
  },
  {
    name: "POST /v1/quotes",
    limit: 60,
    send: () => request(app).post("/v1/quotes").send({}),
    inside: 400,
  },
  {
    name: "POST /v1/designs",
    limit: 20,
    send: () => request(app).post("/v1/designs").send({}),
    inside: 400,
  },
  {
    name: "POST /v1/orders/:number/payment-proof",
    limit: 10,
    send: () => request(app).post("/v1/orders/GP-PK-ABCDEF/payment-proof").send({}),
    inside: 400,
  },
  {
    name: "POST /v1/partner-requests",
    limit: 3,
    send: () => request(app).post("/v1/partner-requests").send({}),
    inside: 400,
  },
  {
    name: "POST /v1/templates/:id/start",
    limit: 30,
    // An id that fails validation after the limiter, so no database work happens.
    send: () => request(app).post("/v1/templates/not-an-id/start").send({}),
    inside: 400,
  },
  {
    name: "POST /v1/auth/login",
    limit: 5,
    send: () =>
      request(app)
        .post("/v1/auth/login")
        .send({ email: "nobody@example.com", password: "x".repeat(12) }),
    inside: 401,
  },
];

describe("rate limits on every public POST", () => {
  for (const { name, limit, send, inside } of cases) {
    it(`${name} answers 429 in the standard shape after ${limit} requests`, async () => {
      for (let i = 0; i < limit; i += 1) {
        const res = await send();
        expect(res.status, `request ${i + 1} of ${limit}`).toBe(inside);
      }
      const limited = await send();
      expect(limited.status).toBe(429);
      const parsed = ErrorResponseSchema.parse(limited.body);
      expect(parsed.error.code).toBe("RATE_LIMITED");
      expect(JSON.stringify(limited.body)).not.toMatch(/stack|node_modules/i);
      expect(limited.headers["ratelimit"] ?? limited.headers["ratelimit-policy"]).toBeDefined();
    });
  }

  it("keeps the order of magnitude sane: no public POST allows more than 60 per minute", () => {
    for (const { name, limit } of cases) {
      expect(limit, name).toBeLessThanOrEqual(60);
    }
  });
});

describe("sign-in from one IP across many emails", () => {
  it("answers 429 after 30 attempts even though every email is different", async () => {
    resetLoginRateLimit();
    resetLoginIpRateLimit();
    const attempt = (i: number) =>
      request(app)
        .post("/v1/auth/login")
        .send({ email: `guess${i}@example.com`, password: "x".repeat(12) });
    for (let i = 0; i < LOGIN_REQUESTS_PER_IP_PER_MINUTE; i += 1) {
      expect((await attempt(i)).status, `attempt ${i + 1}`).toBe(401);
    }
    const limited = await attempt(999);
    expect(limited.status).toBe(429);
    expect(ErrorResponseSchema.parse(limited.body).error.code).toBe("RATE_LIMITED");
    // Thirty argon2 hashes in a row are slow when the whole suite runs at once.
  }, 60_000);
});
