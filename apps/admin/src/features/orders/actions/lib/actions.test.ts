import { nextStatuses, ORDER_STATUSES } from "@giftpop/contracts";
import type { AdminOrderDetail, PaymentRecord } from "@giftpop/contracts";
import { describe, expect, it } from "vitest";

import { describeActionError } from "./action-errors";
import { actionFor, STATUS_ACTIONS } from "./action-labels";
import {
  defaultPaymentKind,
  parseAmountToMinor,
  paymentBlockedReason,
  receivedMinor,
  remainingDueMinor,
  suggestedAmountInput,
  suggestedAmountMinor,
} from "./amount";
import { defaultPaymentMethod, validatePaymentForm } from "./payment-request";
import { buildStatusRequest, EMPTY_STATUS_VALUES, validateStatusForm } from "./status-request";

import { ApiError } from "@/lib/api";

type View = Pick<AdminOrderDetail, "payments" | "quote" | "paymentMode" | "status">;

function payment(
  kind: PaymentRecord["kind"],
  amountMinor: number,
): AdminOrderDetail["payments"][number] {
  return {
    recordedByName: null,
    id: "a".repeat(24),
    kind,
    method: "manual_transfer",
    amount: { amountMinor, currency: "PKR" },
    recordedBy: "b".repeat(24),
    recordedAt: "2026-10-19T10:00:00.000Z",
  };
}

function order(over: Partial<View> = {}): View {
  return {
    status: "awaiting_payment",
    paymentMode: "cod",
    payments: [],
    quote: {
      currency: "PKR",
      mode: "cod",
      goodsMinor: 9000,
      discountMinor: 0,
      shippingMinor: 1000,
      totalMinor: 10000,
      dueNowMinor: 2000,
      dueOnDeliveryMinor: 8000,
    },
    ...over,
  };
}

describe("status actions", () => {
  it("has an action for every status", () => {
    for (const status of ORDER_STATUSES) expect(STATUS_ACTIONS[status].label).toBeTruthy();
  });
  it("uses words that say what happens", () => {
    expect(actionFor("shipped").label).toBe("Mark as shipped");
    expect(actionFor("cancelled").label).toBe("Cancel order");
    expect(actionFor("in_production").label).toBe("Start production");
  });
  it("picks the dialog each target needs", () => {
    expect(actionFor("shipped").dialog).toBe("ship");
    expect(actionFor("cancelled").dialog).toBe("cancel");
    for (const status of ORDER_STATUSES) {
      if (status !== "shipped" && status !== "cancelled") {
        expect(actionFor(status).dialog).toBe("confirm");
      }
    }
  });
  it("offers nothing from a closed order", () => {
    for (const status of ["delivered", "returned", "cancelled"] as const) {
      expect(nextStatuses(status)).toHaveLength(0);
    }
  });
});

describe("status request", () => {
  it("builds a shipped request with trimmed fields and no blank link", () => {
    expect(
      buildStatusRequest("shipped", {
        ...EMPTY_STATUS_VALUES,
        courier: "  TCS ",
        trackingNumber: " 123 ",
        reason: "ignored",
      }),
    ).toEqual({ to: "shipped", courier: "TCS", trackingNumber: "123" });
  });
  it("builds a cancel request with only a reason", () => {
    expect(
      buildStatusRequest("cancelled", {
        ...EMPTY_STATUS_VALUES,
        reason: " Out of stock ",
        note: "x",
      }),
    ).toEqual({ to: "cancelled", reason: "Out of stock" });
  });
  it("builds other requests with an optional note", () => {
    expect(buildStatusRequest("packed", EMPTY_STATUS_VALUES)).toEqual({ to: "packed" });
    expect(buildStatusRequest("packed", { ...EMPTY_STATUS_VALUES, note: " ok " })).toEqual({
      to: "packed",
      note: "ok",
    });
  });
  it("requires courier and tracking number to ship", () => {
    const result = validateStatusForm("shipped", EMPTY_STATUS_VALUES);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.courier).toBeTruthy();
      expect(result.errors.trackingNumber).toBeTruthy();
    }
  });
  it("accepts http and https tracking links only", () => {
    const base = { ...EMPTY_STATUS_VALUES, courier: "TCS", trackingNumber: "1" };
    expect(validateStatusForm("shipped", { ...base, trackingUrl: "https://t.co/1" }).ok).toBe(true);
    for (const bad of ["javascript:alert(1)", "ftp://x.com/1", "not a link"]) {
      const result = validateStatusForm("shipped", { ...base, trackingUrl: bad });
      expect(result.ok, bad).toBe(false);
    }
  });
  it("requires a reason to cancel", () => {
    expect(validateStatusForm("cancelled", EMPTY_STATUS_VALUES).ok).toBe(false);
    expect(
      validateStatusForm("cancelled", { ...EMPTY_STATUS_VALUES, reason: "Duplicate" }).ok,
    ).toBe(true);
  });
  it("lets a plain confirmation through with no fields", () => {
    expect(validateStatusForm("in_production", EMPTY_STATUS_VALUES).ok).toBe(true);
  });
});

describe("parseAmountToMinor", () => {
  it.each([
    ["12.50", 1250],
    ["12.5", 1250],
    ["12", 1200],
    [" 0.05 ", 5],
    [".5", 50],
    ["12.", 1200],
    ["0.10", 10],
    ["90071992547409.91", 9007199254740991],
  ])("reads %s as %i", (input, minor) => {
    expect(parseAmountToMinor(input, "PKR")).toEqual({ ok: true, minor });
  });
  it.each([
    ["", "empty"],
    ["   ", "empty"],
    ["abc", "invalid"],
    ["1,200", "invalid"],
    ["1e3", "invalid"],
    [".", "invalid"],
    ["1.234", "too_many_decimals"],
    ["1.005", "too_many_decimals"],
    ["0", "not_positive"],
    ["0.00", "not_positive"],
    ["-5", "not_positive"],
    ["999999999999999999", "too_large"],
  ])("rejects %j as %s", (input, reason) => {
    expect(parseAmountToMinor(input, "PKR")).toEqual({ ok: false, reason });
  });
  it("uses the order currency's minor unit (rule 7)", () => {
    expect(parseAmountToMinor("500", "JPY")).toEqual({ ok: true, minor: 500 });
    expect(parseAmountToMinor("500.5", "JPY")).toEqual({ ok: false, reason: "too_many_decimals" });
    expect(parseAmountToMinor("1.250", "KWD")).toEqual({ ok: true, minor: 1250 });
  });
});

describe("remaining due and payment defaults", () => {
  it("is the total with nothing received", () => {
    expect(remainingDueMinor(order())).toBe(10000);
  });
  it("subtracts received money and adds back refunds", () => {
    const o = order({ payments: [payment("advance", 2000), payment("balance", 3000)] });
    expect(receivedMinor(o)).toBe(5000);
    expect(remainingDueMinor(o)).toBe(5000);
    const refunded = order({ payments: [payment("full", 10000), payment("refund", 4000)] });
    expect(remainingDueMinor(refunded)).toBe(4000);
  });
  it("never goes below zero", () => {
    expect(remainingDueMinor(order({ payments: [payment("full", 12000)] }))).toBe(0);
  });
  it("defaults to advance for an unpaid cod order below the total", () => {
    expect(defaultPaymentKind(order())).toBe("advance");
    expect(suggestedAmountMinor(order(), "advance")).toBe(2000);
  });
  it("suggests typed text, and nothing for a refund", () => {
    expect(suggestedAmountInput(order(), "advance")).toBe("20.00");
    expect(suggestedAmountInput(order(), "refund")).toBe("");
    expect(suggestedAmountInput(order({ payments: [payment("full", 10000)] }), "balance")).toBe("");
  });
  it("defaults to full for prepaid and for cod when the advance equals the total", () => {
    expect(defaultPaymentKind(order({ paymentMode: "prepaid" }))).toBe("full");
    const same = order();
    same.quote = { ...same.quote, dueNowMinor: 10000 };
    expect(defaultPaymentKind(same)).toBe("full");
  });
  it("defaults to balance once an advance exists", () => {
    const o = order({ payments: [payment("advance", 2000)] });
    expect(defaultPaymentKind(o)).toBe("balance");
    expect(suggestedAmountMinor(o, "balance")).toBe(8000);
    expect(defaultPaymentMethod(o, "balance")).toBe("cod");
  });
  it("defaults to full when everything is already paid", () => {
    expect(defaultPaymentKind(order({ payments: [payment("full", 10000)] }))).toBe("full");
  });
  it("blocks cancelled and returned orders only", () => {
    expect(paymentBlockedReason({ status: "cancelled" })).toBeTruthy();
    expect(paymentBlockedReason({ status: "returned" })).toBeTruthy();
    expect(paymentBlockedReason({ status: "delivered" })).toBeNull();
  });
});

describe("validatePaymentForm", () => {
  const values = {
    amount: "20.00",
    kind: "advance" as const,
    method: "manual_transfer" as const,
    reference: " TX1 ",
    note: "",
  };
  it("builds a request in minor units with no currency", () => {
    const result = validatePaymentForm(order(), values);
    expect(result).toEqual({
      ok: true,
      request: { kind: "advance", method: "manual_transfer", amountMinor: 2000, reference: "TX1" },
    });
    if (result.ok) expect(result.request).not.toHaveProperty("currency");
  });
  it("rejects bad amounts with a message", () => {
    for (const amount of ["", "0", "1.999", "-1"]) {
      const result = validatePaymentForm(order(), { ...values, amount });
      expect(result.ok, amount).toBe(false);
      if (!result.ok) expect(result.errors.amount).toBeTruthy();
    }
  });
  it("rejects a refund above what was received", () => {
    const o = order({ payments: [payment("advance", 2000)] });
    expect(validatePaymentForm(o, { ...values, kind: "refund", amount: "20.01" }).ok).toBe(false);
    expect(validatePaymentForm(o, { ...values, kind: "refund", amount: "20.00" }).ok).toBe(true);
  });
  it("rejects an over-long reference", () => {
    const result = validatePaymentForm(order(), { ...values, reference: "x".repeat(201) });
    expect(result.ok).toBe(false);
  });
});

describe("describeActionError", () => {
  const api = (status: number, code: string, details?: unknown) =>
    new ApiError(status, { code, message: "raw api text", details });

  it("explains a 409 in plain words", () => {
    const result = describeActionError(api(409, "INVALID_TRANSITION"));
    expect(result.message).toContain("changed by someone else");
    expect(result.message).not.toContain("raw api text");
  });
  it("maps missing fields on a 422", () => {
    const result = describeActionError(
      api(422, "MISSING_TRANSITION_FIELD", { missing: ["courier", "trackingNumber"] }),
    );
    expect(result.fields.map((f) => f.path)).toEqual(["courier", "trackingNumber"]);
  });
  it("maps zod issues and renames amountMinor to amount", () => {
    const result = describeActionError(
      api(400, "VALIDATION_ERROR", { issues: [{ path: ["amountMinor"], message: "bad" }] }),
    );
    expect(result.fields).toEqual([{ path: "amount", message: "That amount is not valid" }]);
  });
  it("never shows raw text for other errors", () => {
    for (const error of [api(500, "INTERNAL"), api(0, "NETWORK_ERROR"), new Error("boom")]) {
      expect(describeActionError(error).message).not.toMatch(/raw api text|boom/);
    }
    expect(describeActionError(api(401, "UNAUTHENTICATED")).message).toContain("Sign in");
    expect(describeActionError(api(422, "PAYMENT_REQUIRED")).message).toContain(
      "Record the payment first",
    );
  });
});
