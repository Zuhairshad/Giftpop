import { describe, expect, it } from "vitest";

import { parseSeedEnv } from "./env";

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
    });
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
