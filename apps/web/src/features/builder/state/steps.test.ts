import { describe, expect, it } from "vitest";

import { builderHref } from "./steps";

describe("builderHref", () => {
  it("links to the one builder route of the country", () => {
    expect(builderHref("PK")).toBe("/pk/build");
  });

  it("carries a saved design as an encoded ?from=", () => {
    expect(builderHref("GB", "a b/c")).toBe("/gb/build?from=a%20b%2Fc");
  });
});
