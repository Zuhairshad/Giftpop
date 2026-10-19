import type { AdminOrderListItem } from "@giftpop/contracts";
import { describe, expect, it } from "vitest";

import { appendPage, INITIAL_LIST_STATE, listReducer } from "./state";

function order(n: number): AdminOrderListItem {
  return {
    id: n.toString(16).padStart(24, "0"),
    number: "GP-PK-7K2M9Q",
    createdAt: "2026-10-19T10:00:00.000Z",
    country: "PK",
    customerName: `Customer ${n}`,
    currency: "PKR",
    totalMinor: 250000,
    paymentMode: "prepaid",
    paymentStatus: "paid",
    status: "confirmed",
    itemCount: 3,
    hasPendingProof: false,
  };
}

describe("appendPage", () => {
  it("appends in order and skips duplicates", () => {
    const rows = appendPage([order(1), order(2)], [order(2), order(3), order(3)]);
    expect(rows.map((row) => row.customerName)).toEqual(["Customer 1", "Customer 2", "Customer 3"]);
  });
});

describe("listReducer", () => {
  it("loads the first page then appends the next", () => {
    let state = listReducer(INITIAL_LIST_STATE, {
      type: "first_loaded",
      items: [order(1)],
      nextCursor: "c1",
    });
    expect(state.phase).toBe("ready");
    state = listReducer(state, { type: "more_started" });
    expect(state.more).toBe("loading");
    state = listReducer(state, { type: "more_loaded", items: [order(2)], nextCursor: null });
    expect(state.rows).toHaveLength(2);
    expect(state.nextCursor).toBeNull();
    expect(state.more).toBe("idle");
  });
  it("keeps rows and the cursor when a later page fails", () => {
    let state = listReducer(INITIAL_LIST_STATE, {
      type: "first_loaded",
      items: [order(1)],
      nextCursor: "c1",
    });
    state = listReducer(state, { type: "more_started" });
    state = listReducer(state, { type: "more_failed", message: "Boom" });
    expect(state.rows).toHaveLength(1);
    expect(state.nextCursor).toBe("c1");
    expect(state.more).toBe("error");
    expect(state.moreError).toBe("Boom");
    expect(state.phase).toBe("ready");
  });
  it("a failed first page is an error with no rows", () => {
    const state = listReducer(INITIAL_LIST_STATE, { type: "first_failed", message: "Down" });
    expect(state.phase).toBe("error");
    expect(state.rows).toHaveLength(0);
  });
  it("reset clears everything", () => {
    const loaded = listReducer(INITIAL_LIST_STATE, {
      type: "first_loaded",
      items: [order(1)],
      nextCursor: "c1",
    });
    expect(listReducer(loaded, { type: "reset" })).toEqual(INITIAL_LIST_STATE);
  });
});
