import { describe, expect, it } from "vitest";

import { assertSeedMayRun, parseSeedEnv } from "./env";

const valid = {
  MONGODB_URI: "mongodb://localhost:27017/giftpop?replicaSet=rs0",
  SEED_OWNER_EMAIL: "owner@example.com",
  SEED_OWNER_PASSWORD: "a-long-enough-password",
};

describe("parseSeedEnv", () => {
  it("accepts a complete environment", () => {
    expect(parseSeedEnv(valid)).toEqual({
      mongodbUri: valid.MONGODB_URI,
      ownerEmail: valid.SEED_OWNER_EMAIL,
      ownerPassword: valid.SEED_OWNER_PASSWORD,
      ownerOnly: false,
    });
  });

  it("turns on owner-only mode with SEED_OWNER_ONLY=1 and nothing else", () => {
    expect(parseSeedEnv({ ...valid, SEED_OWNER_ONLY: "1" }).ownerOnly).toBe(true);
    expect(parseSeedEnv({ ...valid, SEED_OWNER_ONLY: "0" }).ownerOnly).toBe(false);
    expect(() => parseSeedEnv({ ...valid, SEED_OWNER_ONLY: "yes" })).toThrow(/SEED_OWNER_ONLY/);
  });

  it("names every missing variable", () => {
    expect(() => parseSeedEnv({})).toThrow(
      /MONGODB_URI[\s\S]*SEED_OWNER_EMAIL[\s\S]*SEED_OWNER_PASSWORD/,
    );
  });

  it("rejects a password shorter than 10 characters", () => {
    expect(() => parseSeedEnv({ ...valid, SEED_OWNER_PASSWORD: "short" })).toThrow(
      /SEED_OWNER_PASSWORD/,
    );
  });

  it("rejects an invalid email", () => {
    expect(() => parseSeedEnv({ ...valid, SEED_OWNER_EMAIL: "not-an-email" })).toThrow(
      /SEED_OWNER_EMAIL/,
    );
  });

  it("rejects a blank MONGODB_URI", () => {
    expect(() => parseSeedEnv({ ...valid, MONGODB_URI: "  " })).toThrow(/MONGODB_URI is required/);
  });
});

describe("assertSeedMayRun", () => {
  const full = { ownerOnly: false };
  const ownerOnly = { ownerOnly: true };

  it("runs anything outside production", () => {
    expect(() => assertSeedMayRun(full, { NODE_ENV: "development" })).not.toThrow();
    expect(() => assertSeedMayRun(full, {})).not.toThrow();
  });

  it("refuses the demo catalog in production unless explicitly allowed", () => {
    expect(() => assertSeedMayRun(full, { NODE_ENV: "production" })).toThrow(
      /SEED_OWNER_ONLY=1[\s\S]*SEED_ALLOW_PRODUCTION=1/,
    );
    expect(() =>
      assertSeedMayRun(full, { NODE_ENV: "production", SEED_ALLOW_PRODUCTION: "1" }),
    ).not.toThrow();
  });

  it("creates only the owner in production without the override, since it changes no catalog data", () => {
    expect(() => assertSeedMayRun(ownerOnly, { NODE_ENV: "production" })).not.toThrow();
  });
});
