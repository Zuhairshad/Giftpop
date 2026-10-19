import type { Order } from "@giftpop/contracts";
import { describe, expect, it } from "vitest";

import { AppError } from "../../../lib/errors";
import { orderDocInput } from "../../orders/fixtures";

import { cardProvider } from "./card";

import { describePayment, providerFor, providerForMethod } from "./index";

type Described = Pick<Order, "number" | "country" | "paymentMode" | "quote">;

function order(mode: "cod" | "prepaid"): Described {
  const base = orderDocInput();
  const quote =
    mode === "cod"
      ? base.quote
      : {
          ...base.quote,
          mode,
          discountMinor: 36_000,
          totalMinor: 169_000,
          dueNowMinor: 169_000,
          dueOnDeliveryMinor: 0,
        };
  return { number: "GP-PK-ABC234", country: "PK", paymentMode: mode, quote };
}

describe("providerFor", () => {
  it("maps payment modes to providers", () => {
    expect(providerFor("prepaid").method).toBe("manual_transfer");
    expect(providerFor("cod").method).toBe("cod");
    expect(providerForMethod("card")).toBe(cardProvider);
  });
});

describe("describePayment", () => {
  it("prepaid owes the full discounted total now", () => {
    const result = describePayment(order("prepaid"), "Send to IBAN 123");
    expect(result).toEqual({
      method: "manual_transfer",
      amountDue: { amountMinor: 169_000, currency: "PKR" },
      text: "Send to IBAN 123",
    });
  });

  it("cod owes the advance now", () => {
    const result = describePayment(order("cod"), "Send to IBAN 123");
    expect(result.method).toBe("cod");
    expect(result.amountDue).toEqual({ amountMinor: 41_000, currency: "PKR" });
    expect(result.text).toBe("Send to IBAN 123");
  });
});

describe("card provider", () => {
  const context = {
    orderNumber: "GP-PK-ABC234",
    country: "PK",
    amountDue: { amountMinor: 1, currency: "PKR" },
    paymentInstructions: "",
  };

  it("is not available", async () => {
    await expect(cardProvider.prepare(context)).rejects.toMatchObject({
      code: "NOT_AVAILABLE",
      httpStatus: 503,
      message: "Card payments are not available yet",
    });
    expect(() => cardProvider.instructions(context)).toThrow(AppError);
  });
});
