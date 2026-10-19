import { describe, expect, it } from "vitest";

import {
  ORDER_STATUSES,
  StatusHistoryEntrySchema,
  TERMINAL_STATUSES,
  TransitionError,
  assertTransition,
  canTransition,
  nextStatuses,
} from "../src/index";
import type { OrderStatus } from "../src/index";

import { id } from "./helpers";

/** Written out by hand from the table in docs/product.md. Not imported from the source. */
const EXPECTED_STATUSES: readonly OrderStatus[] = [
  "awaiting_payment",
  "confirmed",
  "in_production",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivery_failed",
  "delivered",
  "returned",
  "cancelled",
];

const EXPECTED_NEXT: Record<OrderStatus, readonly OrderStatus[]> = {
  awaiting_payment: ["confirmed", "cancelled"],
  confirmed: ["in_production", "cancelled"],
  in_production: ["packed", "cancelled"],
  packed: ["shipped"],
  shipped: ["out_for_delivery", "returned"],
  out_for_delivery: ["delivered", "delivery_failed"],
  delivery_failed: ["out_for_delivery", "returned"],
  delivered: [],
  returned: [],
  cancelled: [],
};

const pairs = EXPECTED_STATUSES.flatMap((from) =>
  EXPECTED_STATUSES.map((to) => ({ from, to, allowed: EXPECTED_NEXT[from].includes(to) })),
);
const allowedPairs = pairs.filter((p) => p.allowed);
const forbiddenPairs = pairs.filter((p) => !p.allowed);

/** Fields that satisfy every status's requirements. */
const FULL_FIELDS = { courier: "DHL", trackingNumber: "TRK123", reason: "Customer asked" };

describe("order status list", () => {
  it("has exactly the ten statuses from docs/product.md", () => {
    expect([...ORDER_STATUSES].sort()).toEqual([...EXPECTED_STATUSES].sort());
    expect(ORDER_STATUSES).toHaveLength(10);
  });

  it("the explicit table covers the full 10x10 matrix", () => {
    expect(pairs).toHaveLength(100);
    expect(allowedPairs).toHaveLength(13);
    expect(forbiddenPairs).toHaveLength(87);
  });
});

describe("canTransition: every pair of the matrix", () => {
  it.each(allowedPairs)("allows $from -> $to", ({ from, to }) => {
    expect(canTransition(from, to)).toBe(true);
  });

  it.each(forbiddenPairs)("forbids $from -> $to", ({ from, to }) => {
    expect(canTransition(from, to)).toBe(false);
  });
});

describe("nextStatuses and terminal statuses", () => {
  it.each(EXPECTED_STATUSES)("nextStatuses(%s) matches the table", (from) => {
    expect([...nextStatuses(from)].sort()).toEqual([...EXPECTED_NEXT[from]].sort());
  });

  it("delivered, returned and cancelled are terminal", () => {
    expect([...TERMINAL_STATUSES].sort()).toEqual(["cancelled", "delivered", "returned"]);
  });

  it.each(["delivered", "returned", "cancelled"] as const)("%s has no exits", (from) => {
    for (const to of EXPECTED_STATUSES) {
      expect(canTransition(from, to)).toBe(false);
      expect(() => assertTransition(from, to, FULL_FIELDS)).toThrow(TransitionError);
    }
  });

  it("a delivery attempt can be retried: delivery_failed -> out_for_delivery", () => {
    expect(canTransition("delivery_failed", "out_for_delivery")).toBe(true);
  });

  it("packed cannot be cancelled and nothing skips ahead", () => {
    expect(canTransition("packed", "cancelled")).toBe(false);
    expect(canTransition("confirmed", "packed")).toBe(false);
    expect(canTransition("packed", "delivered")).toBe(false);
  });
});

describe("assertTransition", () => {
  it.each(allowedPairs)("accepts $from -> $to when fields are complete", ({ from, to }) => {
    expect(() => assertTransition(from, to, FULL_FIELDS)).not.toThrow();
  });

  it.each(forbiddenPairs)("rejects $from -> $to with INVALID_TRANSITION", ({ from, to }) => {
    let caught: unknown;
    try {
      assertTransition(from, to, FULL_FIELDS);
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(TransitionError);
    expect(caught).toMatchObject({ code: "INVALID_TRANSITION", details: { from, to } });
  });

  it("throws a real Error named TransitionError", () => {
    try {
      assertTransition("delivered", "packed");
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(TransitionError);
      expect((error as TransitionError).name).toBe("TransitionError");
    }
  });

  it("checks the transition before the fields", () => {
    expect(() => assertTransition("packed", "cancelled")).toThrow(
      expect.objectContaining({ code: "INVALID_TRANSITION" }),
    );
  });

  it("shipped needs courier AND tracking number", () => {
    expect(() => assertTransition("packed", "shipped")).toThrow(
      expect.objectContaining({
        code: "MISSING_TRANSITION_FIELD",
        details: expect.objectContaining({ missing: ["courier", "trackingNumber"] }),
      }),
    );
    expect(() => assertTransition("packed", "shipped", { courier: "DHL" })).toThrow(
      expect.objectContaining({
        code: "MISSING_TRANSITION_FIELD",
        details: expect.objectContaining({ missing: ["trackingNumber"] }),
      }),
    );
    expect(() => assertTransition("packed", "shipped", { trackingNumber: "T1" })).toThrow(
      expect.objectContaining({
        code: "MISSING_TRANSITION_FIELD",
        details: expect.objectContaining({ missing: ["courier"] }),
      }),
    );
    expect(() =>
      assertTransition("packed", "shipped", { courier: "DHL", trackingNumber: "T1" }),
    ).not.toThrow();
  });

  it.each(["", "   ", "\t\n"])("shipped rejects blank courier or tracking %j", (blank) => {
    expect(() =>
      assertTransition("packed", "shipped", { courier: blank, trackingNumber: "T1" }),
    ).toThrow(expect.objectContaining({ code: "MISSING_TRANSITION_FIELD" }));
    expect(() =>
      assertTransition("packed", "shipped", { courier: "DHL", trackingNumber: blank }),
    ).toThrow(expect.objectContaining({ code: "MISSING_TRANSITION_FIELD" }));
  });

  it.each([["awaiting_payment"], ["confirmed"], ["in_production"]] as const)(
    "cancelling from %s needs a reason",
    (from) => {
      expect(() => assertTransition(from, "cancelled")).toThrow(
        expect.objectContaining({
          code: "MISSING_TRANSITION_FIELD",
          details: expect.objectContaining({ missing: ["reason"] }),
        }),
      );
      expect(() => assertTransition(from, "cancelled", { reason: "  " })).toThrow(
        expect.objectContaining({ code: "MISSING_TRANSITION_FIELD" }),
      );
      expect(() => assertTransition(from, "cancelled", { reason: "Out of stock" })).not.toThrow();
    },
  );

  it("other statuses need no extra fields", () => {
    expect(() => assertTransition("awaiting_payment", "confirmed")).not.toThrow();
    expect(() => assertTransition("out_for_delivery", "delivered")).not.toThrow();
    expect(() => assertTransition("shipped", "returned")).not.toThrow();
  });
});

describe("StatusHistoryEntrySchema", () => {
  const entry = { from: "confirmed", to: "in_production", at: "2026-10-19T10:00:00.000Z" };

  it("accepts a null actor (system) and a null from (order created)", () => {
    expect(StatusHistoryEntrySchema.safeParse({ ...entry, actorId: null }).success).toBe(true);
    expect(
      StatusHistoryEntrySchema.safeParse({
        ...entry,
        from: null,
        to: "awaiting_payment",
        actorId: null,
      }).success,
    ).toBe(true);
    expect(StatusHistoryEntrySchema.safeParse({ ...entry, actorId: id(7) }).success).toBe(true);
  });

  it("rejects unknown statuses and bad timestamps", () => {
    expect(
      StatusHistoryEntrySchema.safeParse({ ...entry, to: "lost", actorId: null }).success,
    ).toBe(false);
    expect(
      StatusHistoryEntrySchema.safeParse({ ...entry, at: "yesterday", actorId: null }).success,
    ).toBe(false);
  });
});
