import type { AdminOrderListItem } from "@giftpop/contracts";
import { describe, expect, it } from "vitest";

import { toRow } from "./row";

const base: AdminOrderListItem = {
  id: "a".repeat(24),
  number: "GP-AE-ABCDEF",
  createdAt: "2026-10-19T10:00:00.000Z",
  country: "AE",
  customerName: "Sara",
  currency: "AED",
  totalMinor: 12550,
  paymentMode: "cod",
  paymentStatus: "advance_paid",
  status: "in_production",
  itemCount: 1,
  hasPendingProof: true,
};

describe("toRow", () => {
  it("builds display text from the shared helpers", () => {
    const row = toRow(base);
    expect(row.href).toBe(`/orders/${"a".repeat(24)}`);
    expect(row.flag).toBe("\u{1F1E6}\u{1F1EA}");
    expect(row.total).toContain("125.50");
    expect(row.statusLabel).toBe("In production");
    expect(row.paymentLabel).toBe("Advance paid");
    expect(row.date).toBe("19 Oct 2026");
    expect(row.items).toBe("1 item");
  });
  it("pluralises items and names a missing customer", () => {
    const row = toRow({ ...base, itemCount: 4, customerName: "  " });
    expect(row.items).toBe("4 items");
    expect(row.customer).toBe("No name");
  });
});
