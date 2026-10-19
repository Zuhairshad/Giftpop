import { describe, expect, it } from "vitest";

import { builderHref, stepHref } from "./steps";
import { BUILDER_STEPS } from "./types";

describe("builderHref", () => {
  it("links to the one builder route of the country", () => {
    expect(builderHref("PK")).toBe("/pk/build");
  });

  it("carries a saved design as an encoded ?from=", () => {
    expect(builderHref("GB", "a b/c")).toBe("/gb/build?from=a%20b%2Fc");
  });
});

describe("stepHref", () => {
  it("never emits an old step URL: every step is the builder route", () => {
    for (const step of BUILDER_STEPS) {
      expect(stepHref("PK", step)).toBe("/pk/build");
    }
  });
});
