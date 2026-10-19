import { describe, expect, it } from "vitest";

import { EnvError, parseEnv } from "./env";

const valid = { MONGODB_URI: "mongodb://localhost:27017/giftpop?replicaSet=rs0" };

describe("parseEnv", () => {
  it("applies defaults", () => {
    const env = parseEnv(valid);
    expect(env.PORT).toBe(4000);
    expect(env.NODE_ENV).toBe("development");
    expect(env.LOG_LEVEL).toBe("info");
    expect(env.CORS_ORIGINS).toEqual([]);
  });

  it("coerces PORT and splits CORS_ORIGINS", () => {
    const env = parseEnv({
      ...valid,
      PORT: "5000",
      CORS_ORIGINS: "http://localhost:3000, http://localhost:3001,",
    });
    expect(env.PORT).toBe(5000);
    expect(env.CORS_ORIGINS).toEqual(["http://localhost:3000", "http://localhost:3001"]);
  });

  it("rejects a missing MONGODB_URI", () => {
    expect(() => parseEnv({})).toThrow(EnvError);
  });

  it("rejects a non-mongodb URI", () => {
    expect(() => parseEnv({ MONGODB_URI: "postgres://x" })).toThrow(/MONGODB_URI/);
  });

  it.each([["0"], ["70000"], ["abc"], ["40.5"]])("rejects PORT=%s", (PORT) => {
    expect(() => parseEnv({ ...valid, PORT })).toThrow(/PORT/);
  });

  it("rejects an unknown NODE_ENV and LOG_LEVEL", () => {
    expect(() => parseEnv({ ...valid, NODE_ENV: "staging" })).toThrow(/NODE_ENV/);
    expect(() => parseEnv({ ...valid, LOG_LEVEL: "loud" })).toThrow(/LOG_LEVEL/);
  });

  it("rejects a CORS origin that is not a URL", () => {
    expect(() => parseEnv({ ...valid, CORS_ORIGINS: "localhost" })).toThrow(/CORS_ORIGINS/);
  });
});
