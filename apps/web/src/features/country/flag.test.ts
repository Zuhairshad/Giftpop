import { describe, expect, it } from "vitest";

import { flagEmoji } from "./flag";

describe("flagEmoji", () => {
  it("builds the flag from regional indicator letters", () => {
    expect(flagEmoji("PK")).toBe("\u{1F1F5}\u{1F1F0}");
    expect(flagEmoji("GB")).toBe("\u{1F1EC}\u{1F1E7}");
  });
  it("accepts lower case", () => {
    expect(flagEmoji("us")).toBe(flagEmoji("US"));
  });
  it("returns an empty string for anything that is not two letters", () => {
    expect(flagEmoji("")).toBe("");
    expect(flagEmoji("USA")).toBe("");
    expect(flagEmoji("1A")).toBe("");
    expect(flagEmoji("<b")).toBe("");
  });
});
