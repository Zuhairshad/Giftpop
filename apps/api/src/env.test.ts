import { describe, expect, it } from "vitest";

import { EnvError, parseEnv } from "./env";

const valid = { MONGODB_URI: "mongodb://localhost:27017/giftpop?replicaSet=rs0" };

describe("parseEnv", () => {
  it("applies defaults", () => {
    const env = parseEnv(valid);
    expect(env.PORT).toBe(4000);
    expect(env.NODE_ENV).toBe("development");
    expect(env.LOG_LEVEL).toBe("info");
    expect(env.CORS_ORIGINS).toEqual(["http://localhost:3000", "http://localhost:3001"]);
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

  describe("phase 1 keys", () => {
    it("uses development defaults for secrets, origins and storage", () => {
      const env = parseEnv(valid);
      expect(env.SESSION_SECRET.length).toBeGreaterThanOrEqual(32);
      expect(env.ADMIN_ORIGIN).toBe("http://localhost:3001");
      expect(env.WEB_ORIGIN).toBe("http://localhost:3000");
      expect(env.STORAGE_DRIVER).toBe("local");
      expect(env.PUBLIC_ASSET_BASE_URL).toBe("http://localhost:4000/v1/assets/files");
    });

    it("requires a real SESSION_SECRET in production", () => {
      expect(() => parseEnv({ ...valid, NODE_ENV: "production", STORAGE_DRIVER: "r2" })).toThrow(
        /SESSION_SECRET/,
      );
      expect(() => parseEnv({ ...valid, SESSION_SECRET: "too-short" })).toThrow(/at least 32/);
    });

    it("requires a real SESSION_SECRET when an origin is https, whatever NODE_ENV says", () => {
      expect(() => parseEnv({ ...valid, ADMIN_ORIGIN: "https://admin.example.com" })).toThrow(
        /SESSION_SECRET/,
      );
    });

    it("refuses local storage in production", () => {
      const prod = { ...valid, NODE_ENV: "production", SESSION_SECRET: "x".repeat(32) };
      expect(() => parseEnv(prod)).toThrow(/STORAGE_DRIVER/);
    });

    it("requires every R2 key when STORAGE_DRIVER=r2", () => {
      expect(() => parseEnv({ ...valid, STORAGE_DRIVER: "r2" })).toThrow(/R2_BUCKET/);
      const env = parseEnv({
        ...valid,
        STORAGE_DRIVER: "r2",
        R2_ACCOUNT_ID: "a",
        R2_ACCESS_KEY_ID: "b",
        R2_SECRET_ACCESS_KEY: "c",
        R2_BUCKET: "assets",
        PUBLIC_ASSET_BASE_URL: "https://cdn.example.com/",
      });
      expect(env.PUBLIC_ASSET_BASE_URL).toBe("https://cdn.example.com");
    });
  });
});
