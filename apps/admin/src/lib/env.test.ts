import { describe, expect, it } from "vitest";

import { getApiUrl, parseServerEnv } from "./env";

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
