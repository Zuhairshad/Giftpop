import { ORDER_STATUSES, PaymentStatusSchema } from "@giftpop/contracts";
import { describe, expect, it } from "vitest";

import { formatDate, paymentLabel, statusHint, statusLabel, statusTone } from "./status-labels";

describe("status labels", () => {
  it("has a label and a hint for every order status", () => {
    for (const status of ORDER_STATUSES) {
      expect(statusLabel(status).length).toBeGreaterThan(2);
      expect(statusHint(status).length).toBeGreaterThan(2);
      expect(statusTone(status)).toMatch(/^bg-/);
    }
  });

  it("uses customer words, not enum names", () => {
    for (const status of ORDER_STATUSES) expect(statusLabel(status)).not.toContain("_");
  });

  it("has a label for every payment status", () => {
    for (const status of PaymentStatusSchema.options) {
      expect(paymentLabel(status).length).toBeGreaterThan(2);
    }
  });

  it("formats a date only, in UTC", () => {
    expect(formatDate("2026-10-19T23:30:00.000Z")).toBe("Oct 19, 2026");
    expect(formatDate("nope")).toBe("");
  });
});
