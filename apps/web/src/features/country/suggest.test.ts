import { describe, expect, it } from "vitest";

import { suggestCountry } from "./suggest";

const live = ["US", "GB", "PK"];

describe("suggestCountry", () => {
  it("maps region subtags to a live country", () => {
    expect(suggestCountry("en-PK", live)).toBe("PK");
    expect(suggestCountry("ur-PK,ur;q=0.9", live)).toBe("PK");
    expect(suggestCountry("en-gb", live)).toBe("GB");
  });
  it("uses q-values, not order", () => {
    expect(suggestCountry("en-US;q=0.5, en-GB;q=0.9", live)).toBe("GB");
  });
  it("keeps header order for equal q", () => {
    expect(suggestCountry("en-GB, en-US", live)).toBe("GB");
  });
  it("skips q=0 and malformed q", () => {
    expect(suggestCountry("en-GB;q=0, en-US;q=0.1", live)).toBe("US");
    expect(suggestCountry("en-GB;q=abc", live)).toBe("GB");
    expect(suggestCountry("en-GB;q=1.2.3", live)).toBeNull();
  });
  it("returns null without a region", () => {
    expect(suggestCountry("en", live)).toBeNull();
    expect(suggestCountry("*", live)).toBeNull();
  });
  it("returns null for an unknown region", () => {
    expect(suggestCountry("en-ZZ", live)).toBeNull();
  });
  it("does not suggest a country that is not live, and falls through to the next tag", () => {
    expect(suggestCountry("en-IN", live)).toBeNull();
    expect(suggestCountry("en-IN, en-US;q=0.8", live)).toBe("US");
  });
  it("handles script subtags and empty input", () => {
    expect(suggestCountry("zh-Hans-PK", live)).toBe("PK");
    expect(suggestCountry("", live)).toBeNull();
    expect(suggestCountry(null, live)).toBeNull();
    expect(suggestCountry("en-US", [])).toBeNull();
  });
});
