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
  it("fits the handoff's 40 UTF-16 unit limit without splitting an emoji", () => {
    expect(firstNameOf(`${"a".repeat(38)}😀😀`)).toBe(`${"a".repeat(38)}😀`);
    expect(firstNameOf(`${"a".repeat(39)}😀`)).toBe("a".repeat(39));
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
