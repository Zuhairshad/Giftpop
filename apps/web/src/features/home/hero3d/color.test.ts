import { describe, expect, it } from "vitest";

import { shade } from "./color";

describe("shade", () => {
  it("mixes towards black and white", () => {
    expect(shade("#ffffff", -0.5)).toBe("#808080");
    expect(shade("#000000", 0.5)).toBe("#808080");
    expect(shade("#336699", 0)).toBe("#336699");
  });

  it("accepts short hex and clamps to a valid colour", () => {
    expect(shade("#fff", -1)).toBe("#000000");
    expect(shade("#fff", 1)).toBe("#ffffff");
  });
});
