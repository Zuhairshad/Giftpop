import { describe, expect, it } from "vitest";

import { ORDER_STATUSES, StatusChangeRequestSchema } from "../src/index";

function failedPaths(input: unknown): string[] {
  const result = StatusChangeRequestSchema.safeParse(input);
  if (result.success) return [];
  return result.error.issues.map((issue) => issue.path.join("."));
}

describe("StatusChangeRequestSchema", () => {
  it("requires courier and trackingNumber for shipped", () => {
    expect(failedPaths({ to: "shipped" }).sort()).toEqual(["courier", "trackingNumber"]);
    expect(failedPaths({ to: "shipped", courier: "DHL" })).toEqual(["trackingNumber"]);
    expect(failedPaths({ to: "shipped", trackingNumber: "T1" })).toEqual(["courier"]);
  });

  it("accepts shipped with both, and trims them", () => {
    const result = StatusChangeRequestSchema.parse({
      to: "shipped",
      courier: "  DHL ",
      trackingNumber: " T1 ",
    });
    expect(result.courier).toBe("DHL");
    expect(result.trackingNumber).toBe("T1");
  });

  it.each(["", "   ", "\t"])("rejects blank courier or tracking %j for shipped", (blank) => {
    expect(
      StatusChangeRequestSchema.safeParse({ to: "shipped", courier: blank, trackingNumber: "T1" })
        .success,
    ).toBe(false);
    expect(
      StatusChangeRequestSchema.safeParse({ to: "shipped", courier: "DHL", trackingNumber: blank })
        .success,
    ).toBe(false);
  });

  it("requires a reason for cancelled", () => {
    expect(failedPaths({ to: "cancelled" })).toEqual(["reason"]);
    expect(failedPaths({ to: "cancelled", reason: "   " })).toContain("reason");
    expect(
      StatusChangeRequestSchema.safeParse({ to: "cancelled", reason: "Customer asked" }).success,
    ).toBe(true);
  });

  it("needs nothing extra for every other status", () => {
    for (const to of ORDER_STATUSES) {
      if (to === "shipped" || to === "cancelled") continue;
      expect(StatusChangeRequestSchema.safeParse({ to }).success).toBe(true);
    }
  });

  it("allows an optional note and rejects unknown statuses", () => {
    expect(
      StatusChangeRequestSchema.safeParse({ to: "confirmed", note: "Paid by transfer" }).success,
    ).toBe(true);
    expect(StatusChangeRequestSchema.safeParse({ to: "teleported" }).success).toBe(false);
    expect(StatusChangeRequestSchema.safeParse({}).success).toBe(false);
  });
});
