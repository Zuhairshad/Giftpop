import { ORDER_STATUSES } from "@giftpop/contracts";
import { describe, expect, it } from "vitest";

import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_STYLES,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_STYLES,
} from "./status";

describe("order status styles", () => {
  it("has a label and a style for every status", () => {
    for (const status of ORDER_STATUSES) {
      expect(ORDER_STATUS_LABELS[status], status).toBeTruthy();
      expect(ORDER_STATUS_STYLES[status], status).toBeTruthy();
    }
  });
  it("gives every status its own colour", () => {
    const styles = ORDER_STATUSES.map((status) => ORDER_STATUS_STYLES[status]);
    expect(new Set(styles).size).toBe(styles.length);
  });
  it("covers every payment status", () => {
    for (const status of ["unpaid", "advance_paid", "paid", "refunded"] as const) {
      expect(PAYMENT_STATUS_LABELS[status]).toBeTruthy();
      expect(PAYMENT_STATUS_STYLES[status]).toBeTruthy();
    }
  });
});
