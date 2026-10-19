import { describe, expect, it } from "vitest";

import { buildTiles, ordersLabel, revenueLines, tileAccessibleName } from "./tiles";

describe("buildTiles", () => {
  const tiles = buildTiles({
    awaitingPaymentWithProof: 2,
    toMake: 0,
    toShip: 5,
    deliveryFailed: 1,
  });

  it("links each tile to the filtered orders list", () => {
    expect(tiles.map((t) => t.href)).toEqual([
      "/orders?status=awaiting_payment&hasPendingProof=true",
      "/orders?status=confirmed",
      "/orders?status=packed",
      "/orders?status=delivery_failed",
    ]);
    expect(tiles.map((t) => t.count)).toEqual([2, 0, 5, 1]);
  });

  it("names a tile by count and label", () => {
    expect(tileAccessibleName({ count: 5, label: "Orders to ship" })).toBe("5 orders to ship");
  });
});

describe("revenueLines", () => {
  it("returns one line per currency and never mixes them", () => {
    const lines = revenueLines([
      { currency: "PKR", amountMinor: 250000 },
      { currency: "AED", amountMinor: 12050 },
    ]);
    expect(lines.map((l) => l.currency)).toEqual(["AED", "PKR"]);
    expect(lines[0]?.text).toContain("120.50");
    expect(lines[1]?.text).toContain("2,500.00");
  });

  it("merges duplicate rows of the same currency only", () => {
    const lines = revenueLines([
      { currency: "AED", amountMinor: 100 },
      { currency: "AED", amountMinor: 250 },
    ]);
    expect(lines).toHaveLength(1);
    expect(lines[0]?.text).toContain("3.50");
  });

  it("is empty for no payments", () => {
    expect(revenueLines([])).toEqual([]);
  });
});

describe("ordersLabel", () => {
  it("pluralises", () => {
    expect(ordersLabel(0)).toBe("0 orders");
    expect(ordersLabel(1)).toBe("1 order");
  });
});
