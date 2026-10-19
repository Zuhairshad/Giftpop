import mongoose from "mongoose";
import request from "supertest";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { createTestApp } from "../test/app";
import { startTestMongo, type TestMongo } from "../test/mongo";

import { backoffDelay, connectDb, disconnectDb, isDbReady } from "./db";

describe("backoffDelay", () => {
  it("doubles each attempt and caps at 10 seconds", () => {
    expect(backoffDelay(1, 250)).toBe(250);
    expect(backoffDelay(2, 250)).toBe(500);
    expect(backoffDelay(3, 250)).toBe(1000);
    expect(backoffDelay(20, 250)).toBe(10_000);
  });
});

describe("connectDb and /ready", () => {
  const app = createTestApp();
  let mongo: TestMongo;

  beforeAll(async () => {
    mongo = await startTestMongo();
  });

  afterAll(async () => {
    await disconnectDb();
    await mongo.stop();
  });

  it("reports 503 before a connection exists", async () => {
    expect(isDbReady()).toBe(false);
    const res = await request(app).get("/ready");
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe("INTERNAL");
  });

  it("gives up after maxAttempts when Mongo is unreachable", async () => {
    await expect(
      connectDb({
        uri: "mongodb://127.0.0.1:1/giftpop",
        maxAttempts: 2,
        baseDelayMs: 10,
        serverSelectionTimeoutMs: 200,
      }),
    ).rejects.toThrow();
    expect(isDbReady()).toBe(false);
  });

  it("reports ready once connected to a replica set", async () => {
    await connectDb({ uri: mongo.uri, maxAttempts: 2, baseDelayMs: 10 });
    expect(isDbReady()).toBe(true);
    const res = await request(app).get("/ready");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ready" });
  });

  it("supports transactions (replica set)", async () => {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await mongoose.connection.collection("tx_probe").insertOne({ ok: true }, { session });
      });
    } finally {
      await session.endSession();
    }
    expect(await mongoose.connection.collection("tx_probe").countDocuments()).toBe(1);
  });

  it("goes back to 503 after disconnect, while /health stays ok", async () => {
    await disconnectDb();
    expect((await request(app).get("/ready")).status).toBe(503);
    expect((await request(app).get("/health")).status).toBe(200);
  });
});

describe("/ready pings the database", () => {
  const app = createTestApp();
  let mongo: TestMongo;

  beforeAll(async () => {
    mongo = await startTestMongo();
    await connectDb({ uri: mongo.uri, maxAttempts: 2, baseDelayMs: 10 });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    await disconnectDb();
    await mongo.stop();
  });

  it("answers 503 within the ping timeout when the connection looks open but nothing answers", async () => {
    // A silent network partition: Mongoose still says "connected" and commands never return.
    const db = mongoose.connection.db;
    if (!db) throw new Error("expected a connected database");
    vi.spyOn(db, "command").mockReturnValue(new Promise(() => {}));
    expect(isDbReady()).toBe(true);

    const started = Date.now();
    const res = await request(app).get("/ready");
    expect(res.status).toBe(503);
    expect(res.body.error).toEqual({ code: "INTERNAL", message: "Database is not reachable" });
    expect(Date.now() - started).toBeLessThan(5_000);
  });

  it("answers 503 when the ping fails, and 200 once it answers again", async () => {
    const db = mongoose.connection.db;
    if (!db) throw new Error("expected a connected database");
    const spy = vi.spyOn(db, "command").mockRejectedValueOnce(new Error("not primary"));
    expect((await request(app).get("/ready")).status).toBe(503);
    spy.mockRestore();
    expect((await request(app).get("/ready")).status).toBe(200);
  });
});
