import { TransitionError } from "@giftpop/contracts";
import { Router } from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import { createTestApp } from "../test/app";

import { AppError } from "./lib/errors";
import { validateBody, validateQuery } from "./lib/validate";

const BodySchema = z.object({ name: z.string().min(1), qty: z.number().int().min(1) });
const QuerySchema = z.object({ page: z.coerce.number().int().min(1).default(1) });

const router = Router();
router.post("/echo", validateBody(BodySchema), (req, res) => {
  res.json(req.body);
});
router.get("/page", validateQuery(QuerySchema), (req, res) => {
  res.json(req.query);
});
router.get("/app-error", () => {
  throw new AppError("FORBIDDEN", 403, "Staff only", { role: "staff" });
});
router.get("/async-error", async () => {
  await Promise.resolve();
  throw new AppError("CONFLICT", 409, "Already there");
});
router.get("/boom", () => {
  throw new Error("secret database password in message");
});
router.get("/bad-transition", () => {
  throw new TransitionError("INVALID_TRANSITION", "no", { from: "delivered", to: "packed" });
});
router.get("/missing-field", () => {
  throw new TransitionError("MISSING_TRANSITION_FIELD", "needs courier", {
    from: "packed",
    to: "shipped",
    missing: ["courier"],
  });
});

const app = createTestApp([{ path: "/test", router }]);

describe("/health", () => {
  it("is ok without a database", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("sets a request id and security headers", async () => {
    const res = await request(app).get("/health").set("x-request-id", "abc-123");
    expect(res.headers["x-request-id"]).toBe("abc-123");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });
});

describe("cors", () => {
  it("allows a configured origin", async () => {
    const res = await request(app).get("/health").set("Origin", "http://localhost:3000");
    expect(res.headers["access-control-allow-origin"]).toBe("http://localhost:3000");
  });

  it("does not allow other origins", async () => {
    const res = await request(app).get("/health").set("Origin", "http://evil.example");
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });
});

describe("404", () => {
  it("returns the error shape for unknown routes", async () => {
    const res = await request(app).get("/nope");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      error: { code: "NOT_FOUND", message: "No route for GET /nope" },
    });
  });

  it("does not serve health under /v1", async () => {
    expect((await request(app).get("/v1/health")).status).toBe(404);
  });
});

describe("validation", () => {
  it("passes the parsed body through", async () => {
    const res = await request(app).post("/v1/test/echo").send({ name: "Rose", qty: 2, price: 1 });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ name: "Rose", qty: 2 });
  });

  it("returns VALIDATION_ERROR with issues as details", async () => {
    const res = await request(app).post("/v1/test/echo").send({ name: "", qty: 0 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.details).toHaveLength(2);
    expect(res.body.error.details[0]).toHaveProperty("path");
  });

  it("replaces req.query with the parsed value", async () => {
    const res = await request(app).get("/v1/test/page?page=3");
    expect(res.body).toEqual({ page: 3 });
    expect((await request(app).get("/v1/test/page")).body).toEqual({ page: 1 });
  });

  it("rejects a bad query", async () => {
    const res = await request(app).get("/v1/test/page?page=0");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects malformed JSON", async () => {
    const res = await request(app)
      .post("/v1/test/echo")
      .set("Content-Type", "application/json")
      .send("{not json");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects a body over 100kb", async () => {
    const res = await request(app)
      .post("/v1/test/echo")
      .send({ name: "x".repeat(110_000), qty: 1 });
    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("error middleware", () => {
  it("maps AppError with details", async () => {
    const res = await request(app).get("/v1/test/app-error");
    expect(res.status).toBe(403);
    expect(res.body).toEqual({
      error: { code: "FORBIDDEN", message: "Staff only", details: { role: "staff" } },
    });
  });

  it("maps errors thrown from async handlers", async () => {
    const res = await request(app).get("/v1/test/async-error");
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("CONFLICT");
  });

  it("hides unknown errors and never leaks a stack", async () => {
    const res = await request(app).get("/v1/test/boom");
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: { code: "INTERNAL", message: "Something went wrong" } });
    expect(JSON.stringify(res.body)).not.toMatch(/secret|stack|\.ts/);
  });

  it("maps TransitionError to 409 and 422", async () => {
    const invalid = await request(app).get("/v1/test/bad-transition");
    expect(invalid.status).toBe(409);
    expect(invalid.body.error.code).toBe("INVALID_TRANSITION");
    const missing = await request(app).get("/v1/test/missing-field");
    expect(missing.status).toBe(422);
    expect(missing.body.error.code).toBe("MISSING_TRANSITION_FIELD");
    expect(missing.body.error.details.missing).toEqual(["courier"]);
  });
});
