import { describe, expect, it } from "vitest";

import { firstNameOf, orderEyebrow } from "./thank-you";

describe("firstNameOf", () => {
  it("takes the first word of the full name", () => {
    expect(firstNameOf("Sara Khan")).toBe("Sara");
    expect(firstNameOf("  Amna   B. ")).toBe("Amna");
    expect(firstNameOf("Zoë")).toBe("Zoë");
  });
  it("answers null for blank names", () => {
    expect(firstNameOf("")).toBeNull();
    expect(firstNameOf("   ")).toBeNull();
    expect(firstNameOf(null)).toBeNull();
    expect(firstNameOf(undefined)).toBeNull();
  });
  it("caps at 40 code points without splitting an emoji", () => {
    const name = `${"a".repeat(39)}😀😀`;
    expect(firstNameOf(name)).toBe(`${"a".repeat(39)}😀`);
  });
});

describe("orderEyebrow", () => {
  it("thanks the customer by name when known", () => {
    expect(orderEyebrow("awaiting_payment", "Sara")).toBe("Thank you, Sara!");
    expect(orderEyebrow(null, "Sara")).toBe("Thank you, Sara!");
  });
  it("thanks without a name otherwise", () => {
    expect(orderEyebrow("delivered", null)).toBe("Thank you!");
  });
  it("stays neutral for cancelled and returned orders", () => {
    expect(orderEyebrow("cancelled", "Sara")).toBe("Made by hand, just for you");
    expect(orderEyebrow("returned", null)).toBe("Made by hand, just for you");
  });
});
