import { describe, expect, it } from "vitest";

import { templateLinkLabel, templateStartHref } from "./template-href";

describe("templateStartHref", () => {
  it("points the builder at the saved gift", () => {
    expect(templateStartHref("PK", "/pk/build/review?from=abc123XYZ_")).toBe(
      "/pk/build?from=abc123XYZ_",
    );
  });

  it("lower-cases the country and keeps the share id encoded", () => {
    expect(templateStartHref("GB", "/gb/build/review?from=a%20b")).toBe("/gb/build?from=a%20b");
  });

  it("leaves a link without a share id as it is", () => {
    expect(templateStartHref("PK", "/pk/build/review")).toBe("/pk/build/review");
    expect(templateStartHref("PK", "/pk/build/review?from=")).toBe("/pk/build/review?from=");
  });
});

describe("templateLinkLabel", () => {
  it("begins with the visible link text", () => {
    expect(templateLinkLabel("Birthday box")).toBe("Start from this: Birthday box");
    expect(templateLinkLabel("Birthday box").startsWith("Start from this")).toBe(true);
  });
});
