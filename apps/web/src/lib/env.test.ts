import { describe, expect, it } from "vitest";

import { parseServerEnv } from "./env";

describe("parseServerEnv", () => {
  it("defaults API_URL to the local API", () => {
    expect(parseServerEnv({}).API_URL).toBe("http://localhost:4000");
  });

  it("treats an empty API_URL as unset", () => {
    expect(parseServerEnv({ API_URL: "" }).API_URL).toBe("http://localhost:4000");
  });

  it("strips trailing slashes", () => {
    expect(parseServerEnv({ API_URL: "https://api.example.com//" }).API_URL).toBe(
      "https://api.example.com",
    );
  });

  it("refuses to fall back to localhost in production", () => {
    expect(() => parseServerEnv({ NODE_ENV: "production" })).toThrow(/API_URL is required/);
    expect(() => parseServerEnv({ NODE_ENV: "production", API_URL: " " })).toThrow(
      /API_URL is required/,
    );
    expect(
      parseServerEnv({ NODE_ENV: "production", API_URL: "https://api.example.com" }).API_URL,
    ).toBe("https://api.example.com");
  });

  it("rejects a value that is not a URL", () => {
    expect(() => parseServerEnv({ API_URL: "not a url" })).toThrow(/Invalid environment/);
  });
});
