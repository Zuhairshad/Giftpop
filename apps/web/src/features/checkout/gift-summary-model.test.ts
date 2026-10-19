import { describe, expect, it } from "vitest";

import { giftContentsLine, giftRecipientLine } from "./gift-summary-model";

describe("giftContentsLine", () => {
  it("names the packaging and counts the items", () => {
    expect(giftContentsLine("Bouquet", 6)).toBe("Bouquet, 6 items");
  });

  it("uses the singular for one item", () => {
    expect(giftContentsLine("Mug", 1)).toBe("Mug, 1 item");
  });
});

describe("giftRecipientLine", () => {
  it("says who the gift is for", () => {
    expect(giftRecipientLine("  Sara ")).toBe("For Sara");
  });

  it("is null when no recipient was given", () => {
    expect(giftRecipientLine("   ")).toBeNull();
  });
});
