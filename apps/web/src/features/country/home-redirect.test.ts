import { describe, expect, it } from "vitest";

import { homeRedirectTarget } from "./home-redirect";

describe("homeRedirectTarget", () => {
  it("redirects / with a valid cookie to the lower-case country", () => {
    expect(homeRedirectTarget("/", "gp_country=PK")).toBe("/pk");
  });
  it("does nothing without a cookie or with an invalid one", () => {
    expect(homeRedirectTarget("/", null)).toBeNull();
    expect(homeRedirectTarget("/", "gp_country=nope")).toBeNull();
  });
  it("does nothing for other paths", () => {
    for (const path of [
      "/countries",
      "/pk",
      "/api/countries",
      "/_next/static/a.js",
      "/favicon.ico",
      "//",
    ]) {
      expect(homeRedirectTarget(path, "gp_country=PK")).toBeNull();
    }
  });
});
