import { describe, expect, it } from "vitest";

import { getApiUrl, getWebOrigin, parseServerEnv } from "./env";

describe("server env", () => {
  it("defaults API_URL to localhost:4000", () => {
    expect(getApiUrl({})).toBe("http://localhost:4000");
    expect(getApiUrl({ API_URL: "  " })).toBe("http://localhost:4000");
  });

  it("strips trailing slashes", () => {
    expect(getApiUrl({ API_URL: "https://api.example.com//" })).toBe("https://api.example.com");
  });

  it("refuses to fall back to localhost in production", () => {
    expect(() => getApiUrl({ NODE_ENV: "production" })).toThrow(/API_URL is required/);
    expect(getApiUrl({ NODE_ENV: "production", API_URL: "https://api.example.com/" })).toBe(
      "https://api.example.com",
    );
  });

  it("refuses a value that is not a URL", () => {
    expect(() => parseServerEnv({ API_URL: "not a url" })).toThrow();
  });
});

describe("web origin", () => {
  it("is unset when WEB_ORIGIN is missing or blank", () => {
    expect(getWebOrigin({})).toBeUndefined();
    expect(getWebOrigin({ WEB_ORIGIN: "  " })).toBeUndefined();
  });

  it("returns the origin without a path or trailing slash", () => {
    expect(getWebOrigin({ WEB_ORIGIN: "https://shop.example.com/" })).toBe(
      "https://shop.example.com",
    );
    expect(getWebOrigin({ WEB_ORIGIN: " http://localhost:3000 " })).toBe("http://localhost:3000");
  });

  it("refuses a value that is not an http(s) URL", () => {
    expect(() => getWebOrigin({ WEB_ORIGIN: "not a url" })).toThrow(/WEB_ORIGIN/);
    expect(() => getWebOrigin({ WEB_ORIGIN: "ftp://example.com" })).toThrow(/WEB_ORIGIN/);
  });
});
