import { ErrorResponseSchema } from "@giftpop/contracts";
import { Router } from "express";
import mongoose from "mongoose";
import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../../src/app";
import { parseEnv } from "../../src/env";
import { createLogger } from "../../src/logger";
import { createTestApp } from "../app";

const WEB = "http://localhost:3000";

describe("CORS", () => {
  const app = createTestApp();

  it("allows a listed origin with credentials and says Vary: Origin", async () => {
    const res = await request(app).get("/health").set("Origin", WEB);
    expect(res.headers["access-control-allow-origin"]).toBe(WEB);
    expect(res.headers["access-control-allow-credentials"]).toBe("true");
    expect(res.headers["vary"]).toMatch(/Origin/);
  });

  it("gives an unlisted origin no CORS headers, on a request and on a preflight", async () => {
    for (const origin of ["https://evil.example", "null", "http://localhost:3000.evil.example"]) {
      const simple = await request(app).get("/health").set("Origin", origin);
      expect(simple.headers["access-control-allow-origin"], origin).toBeUndefined();
      // The cors package still sends Allow-Credentials here; without an Allow-Origin
      // header the browser refuses the response, so this is harmless.

      const preflight = await request(app)
        .options("/v1/orders")
        .set("Origin", origin)
        .set("Access-Control-Request-Method", "POST")
        .set("Access-Control-Request-Headers", "content-type");
      expect(preflight.headers["access-control-allow-origin"], origin).toBeUndefined();
    }
  });

  it("never answers with a wildcard origin", async () => {
    for (const origin of [WEB, "https://evil.example", "null"]) {
      const res = await request(app).get("/health").set("Origin", origin);
      expect(res.headers["access-control-allow-origin"]).not.toBe("*");
    }
  });

  it("takes the allowlist from the env only, and the env parser refuses a wildcard", () => {
    const env = parseEnv({
      NODE_ENV: "test",
      MONGODB_URI: "mongodb://localhost:27017/x",
      CORS_ORIGINS: "https://shop.example",
    });
    expect(env.CORS_ORIGINS).toEqual(["https://shop.example"]);
    expect(() => parseEnv({ MONGODB_URI: "mongodb://x", CORS_ORIGINS: "*" })).toThrow();

    const custom = createApp({ env, logger: createLogger(env), modules: [] });
    return request(custom)
      .get("/health")
      .set("Origin", "https://shop.example")
      .then((res) => {
        expect(res.headers["access-control-allow-origin"]).toBe("https://shop.example");
        return request(custom).get("/health").set("Origin", WEB);
      })
      .then((res) => expect(res.headers["access-control-allow-origin"]).toBeUndefined());
  });

  it("defaults to the web and admin origins when no list is set", () => {
    const env = parseEnv({ MONGODB_URI: "mongodb://x" });
    expect(env.CORS_ORIGINS).toEqual([env.WEB_ORIGIN, env.ADMIN_ORIGIN]);
  });
});

describe("helmet headers", () => {
  const app = createTestApp();

  for (const [label, path] of [
    ["a success", "/health"],
    ["a 404", "/v1/nothing-here"],
    ["a validation error", "/v1/quotes"],
  ] as const) {
    it(`are set on ${label} response`, async () => {
      const res =
        path === "/v1/quotes"
          ? await request(app).post(path).send({})
          : await request(app).get(path);
      expect(res.headers["x-content-type-options"]).toBe("nosniff");
      expect(res.headers["strict-transport-security"]).toMatch(/max-age=\d+/);
      expect(res.headers["x-frame-options"]).toBeDefined();
      expect(res.headers["content-security-policy"]).toMatch(/default-src 'self'/);
      expect(res.headers["referrer-policy"]).toBeDefined();
      expect(res.headers["cross-origin-opener-policy"]).toBeDefined();
      expect(res.headers["x-powered-by"]).toBeUndefined();
    });
  }
});

describe("error responses never leak internals", () => {
  const boom = Router();
  boom.get("/sync", () => {
    throw new Error(
      "ENOENT: /home/user/Giftpop/apps/api/secret.txt MONGODB_URI=mongodb://u:p@h/db",
    );
  });
  boom.get("/async", async () => {
    await Promise.resolve();
    throw new Error("connect ECONNREFUSED 10.0.0.5:27017 SESSION_SECRET=abc");
  });
  boom.get("/cast", () => {
    throw new mongoose.Error.CastError("ObjectId", "not-an-id", "_id");
  });
  boom.get("/mongo", () => {
    throw Object.assign(
      new Error("E11000 duplicate key error collection: giftpop.staff index: email_1"),
      {
        code: 11000,
        keyValue: { email: "a@b.c" },
      },
    );
  });
  boom.get("/mongo-other", () => {
    throw Object.assign(new Error("not primary and secondaryOk=false"), {
      name: "MongoServerError",
      code: 10107,
    });
  });
  boom.get("/object", () => {
    throw { message: "secret detail", stack: "at /home/user/x.ts:1:1" };
  });
  boom.get("/string", () => {
    throw "token=abc";
  });
  boom.post("/echo", (req, res) => void res.json(req.body));
  const app = createTestApp([{ path: "/boom", router: boom }]);

  const LEAKS =
    /node_modules|\/home\/|\.tsx?:\d|mongodb:|MONGODB_URI|SESSION_SECRET|ECONNREFUSED|E11000|Cast to|ObjectId|secondaryOk|stack|token=|secret/i;

  function expectSafe(res: request.Response, status: number) {
    expect(res.status).toBe(status);
    expect(res.headers["content-type"]).toMatch(/json/);
    const parsed = ErrorResponseSchema.parse(res.body);
    expect(Object.keys(res.body)).toEqual(["error"]);
    expect(JSON.stringify(res.body)).not.toMatch(LEAKS);
    expect(res.text).not.toMatch(LEAKS);
    return parsed;
  }

  it("hides a thrown Error and its message (sync and async)", async () => {
    expect(expectSafe(await request(app).get("/v1/boom/sync"), 500).error.code).toBe("INTERNAL");
    expect(expectSafe(await request(app).get("/v1/boom/async"), 500).error.code).toBe("INTERNAL");
  });

  it("answers a CastError as a plain 400 without the Mongoose text", async () => {
    expect(expectSafe(await request(app).get("/v1/boom/cast"), 400).error.code).toBe(
      "VALIDATION_ERROR",
    );
  });

  it("hides Mongo error text for duplicates and other server errors", async () => {
    expect(expectSafe(await request(app).get("/v1/boom/mongo"), 409).error.code).toBe("CONFLICT");
    expectSafe(await request(app).get("/v1/boom/mongo-other"), 500);
  });

  it("hides thrown non-Error values", async () => {
    expectSafe(await request(app).get("/v1/boom/object"), 500);
    expectSafe(await request(app).get("/v1/boom/string"), 500);
  });

  it("answers malformed JSON with a generic 400", async () => {
    const res = await request(app)
      .post("/v1/boom/echo")
      .set("Content-Type", "application/json")
      .send('{"a": "secret-value", bad');
    expectSafe(res, 400);
    expect(res.text).not.toMatch(/Unexpected token|position|JSON\.parse|secret-value/);
  });

  it("answers an oversize JSON body with 413 and no limit internals", async () => {
    const res = await request(app)
      .post("/v1/boom/echo")
      .send({ blob: "x".repeat(150 * 1024) });
    const parsed = expectSafe(res, 413);
    expect(parsed.error.code).toBe("VALIDATION_ERROR");
  });

  it("decodes a UTF-7 body (body-parser accepts any utf-* charset) before the key guard runs", async () => {
    // "+ACQ-" is "$" in UTF-7. The guard sees the decoded object, so this is still refused.
    const res = await request(app)
      .post("/v1/boom/echo")
      .set("Content-Type", "application/json; charset=utf-7")
      .send('{"+ACQ-ne": 1}');
    expectSafe(res, 400);
  });

  it("answers an unsupported content encoding with a generic 400", async () => {
    const encoding = await request(app)
      .post("/v1/boom/echo")
      .set("Content-Type", "application/json")
      .set("Content-Encoding", "br")
      .send("not brotli");
    expectSafe(encoding, 400);
  });

  it("does not parse form posts: a cross-site form arrives as an empty body", async () => {
    const res = await request(app)
      .post("/v1/boom/echo")
      .type("form")
      .send("country=PK&design[items]=1");
    expect(res.status).toBe(200);
    expect(res.text).toBe("");
  });

  it("answers an unknown route with the standard shape and no stack", async () => {
    expectSafe(await request(app).get("/v1/definitely/not/here"), 404);
  });
});
