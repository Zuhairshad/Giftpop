import { describe, expect, it } from "vitest";

import { describeRejection, readTemplateRejection } from "./problems";

describe("readTemplateRejection", () => {
  it("reads object and string problems", () => {
    expect(
      readTemplateRejection({
        country: "PK",
        problems: [{ code: "OUT_OF_STOCK", message: "Box is out of stock." }, "Too few items."],
      }),
    ).toEqual({ country: "PK", problems: ["Box is out of stock.", "Too few items."] });
  });
  it("handles a missing country and unknown shapes", () => {
    expect(readTemplateRejection({ problems: ["x"] })).toEqual({ country: null, problems: ["x"] });
    expect(readTemplateRejection(undefined)).toBeNull();
    expect(readTemplateRejection({ problems: [] })).toBeNull();
    expect(readTemplateRejection({ problems: [42] })).toBeNull();
  });
});

describe("describeRejection", () => {
  it("names the country", () => {
    const text = describeRejection(
      { country: "PK", problems: ["Box is out of stock."] },
      () => "Pakistan",
    );
    expect(text).toContain("Pakistan");
    expect(text).toContain("Box is out of stock.");
  });
  it("works without a country", () => {
    expect(describeRejection({ country: null, problems: ["a"] }, (c) => c)).toContain(
      "one of the chosen",
    );
  });
});
