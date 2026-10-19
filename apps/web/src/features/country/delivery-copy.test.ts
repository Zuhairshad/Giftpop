import { describe, expect, it } from "vitest";

import { deliveryEstimate } from "./delivery-copy";

describe("deliveryEstimate", () => {
  it("shows a range", () => {
    expect(deliveryEstimate({ min: 3, max: 7 })).toBe("Usually 3 to 7 days");
  });
  it("shows a single number", () => {
    expect(deliveryEstimate({ min: 2, max: 2 })).toBe("Usually 2 days");
    expect(deliveryEstimate({ min: 1, max: 1 })).toBe("Usually 1 day");
  });
  it("handles a zero minimum", () => {
    expect(deliveryEstimate({ min: 0, max: 3 })).toBe("Usually within 3 days");
    expect(deliveryEstimate({ min: 0, max: 1 })).toBe("Usually within 1 day");
  });
  it("handles same day", () => {
    expect(deliveryEstimate({ min: 0, max: 0 })).toBe("Usually the same day");
  });
});
