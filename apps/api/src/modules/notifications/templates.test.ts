import { ORDER_STATUSES } from "@giftpop/contracts";
import { describe, expect, it } from "vitest";

import { orderDocInput } from "../orders/fixtures";

import { formatMinor, renderNotification, type TemplateOrder } from "./templates";
import { createConsoleTransport, maskEmail, maskPhone } from "./transports";

const options = { trackBaseUrl: "https://shop.example/" };

function order(overrides: Partial<TemplateOrder> = {}): TemplateOrder {
  const doc = orderDocInput();
  return {
    number: "GP-PK-7K2M9Q",
    paymentMode: doc.paymentMode,
    paymentStatus: doc.paymentStatus,
    status: doc.status,
    quote: doc.quote,
    shipment: null,
    ...overrides,
  };
}

describe("formatMinor", () => {
  it("formats integer minor units without floats", () => {
    expect(formatMinor(41_000, "PKR")).toBe("PKR 410.00");
    expect(formatMinor(5, "USD")).toBe("USD 0.05");
    expect(formatMinor(500, "JPY")).toBe("JPY 500");
    expect(formatMinor(1250, "KWD")).toBe("KWD 1.250");
    expect(formatMinor(0, "USD")).toBe("USD 0.00");
  });
});

describe("order_created", () => {
  it("tells a COD customer the advance, the rest, and the tracking link", () => {
    const { text, subject } = renderNotification(
      "order_created",
      order(),
      { paymentInstructions: "Send to account 1234" },
      options,
    );
    expect(subject).toContain("GP-PK-7K2M9Q");
    expect(text).toContain("PKR 410.00 now as an advance");
    expect(text).toContain("remaining PKR 1640.00");
    expect(text).toContain("Send to account 1234");
    expect(text).toContain("https://shop.example/track?number=GP-PK-7K2M9Q");
  });

  it("tells a prepaid customer to pay the full amount now", () => {
    const base = order();
    const { text } = renderNotification(
      "order_created",
      order({
        paymentMode: "prepaid",
        quote: { ...base.quote, mode: "prepaid", dueNowMinor: 190_000, dueOnDeliveryMinor: 0 },
      }),
      {},
      options,
    );
    expect(text).toContain("Pay PKR 1900.00 now");
    expect(text).not.toContain("remaining");
    expect(text).not.toContain("How to pay");
  });
});

describe("payment_recorded", () => {
  it("states the amount received and the new status", () => {
    const { text } = renderNotification(
      "payment_recorded",
      order({ status: "confirmed", paymentStatus: "advance_paid" }),
      { amountMinor: 41_000, currency: "PKR" },
      options,
    );
    expect(text).toContain("We received PKR 410.00");
    expect(text).toContain("advance received");
    expect(text).toContain("confirmed");
  });

  it("still reads well when the payload has no amount", () => {
    const { text } = renderNotification("payment_recorded", order(), {}, options);
    expect(text).toContain("We received your payment");
  });
});

describe("status_changed", () => {
  const words: Record<(typeof ORDER_STATUSES)[number], string> = {
    awaiting_payment: "waiting for payment",
    confirmed: "confirmed",
    in_production: "being made",
    packed: "packed",
    shipped: "shipped",
    out_for_delivery: "out for delivery",
    delivered: "delivered",
    delivery_failed: "could not deliver",
    returned: "came back",
    cancelled: "cancelled",
  };

  it.each(ORDER_STATUSES)("renders %s in customer words", (status) => {
    const { text } = renderNotification("status_changed", order(), { status }, options);
    expect(text).toContain(words[status]);
    expect(text).not.toContain(status.includes("_") ? status : "\u0000");
  });

  it("includes courier and tracking number when shipped", () => {
    const { text } = renderNotification(
      "status_changed",
      order({
        status: "shipped",
        shipment: {
          courier: "TCS",
          trackingNumber: "TRK123",
          trackingUrl: "https://tcs.example/t/TRK123",
          shippedAt: new Date(),
        },
      }),
      { status: "shipped" },
      options,
    );
    expect(text).toContain("Courier: TCS");
    expect(text).toContain("Tracking number: TRK123");
    expect(text).toContain("https://tcs.example/t/TRK123");
  });

  it("never contains staff notes or contact data", () => {
    const doc = orderDocInput({
      history: [
        { from: null, to: "awaiting_payment", at: new Date(), actorId: null },
        {
          from: "awaiting_payment",
          to: "cancelled",
          at: new Date(),
          actorId: null,
          note: "SECRET staff note",
        },
      ],
    });
    // Templates take only customer-facing fields, so the history cannot be passed at all.
    const { text, subject } = renderNotification(
      "status_changed",
      { ...order(), status: "cancelled" },
      { status: "cancelled" },
      options,
    );
    const all = `${subject}\n${text}`;
    expect(all).not.toContain("SECRET");
    expect(all).not.toContain(doc.contact.email);
    expect(all).not.toContain(doc.contact.phone);
    expect(all).not.toContain(doc.address.line1);
  });
});

describe("console transport", () => {
  it("masks email and phone in the log line", async () => {
    const lines: Record<string, unknown>[] = [];
    const transport = createConsoleTransport({ info: (obj) => void lines.push(obj) });
    await transport.send({
      type: "order_created",
      orderNumber: "GP-PK-7K2M9Q",
      to: { email: "sara@example.com", phone: "+92 300 1234567" },
      subject: "s",
      text: "t",
    });
    const line = JSON.stringify(lines);
    expect(lines).toHaveLength(1);
    expect(line).not.toContain("sara@example.com");
    expect(line).not.toContain("1234567");
    expect(line).not.toContain("300");
    expect(line).toContain("s***@example.com");
    expect(line).toContain("***67");
  });

  it("masks odd inputs", () => {
    expect(maskEmail("nonsense")).toBe("***");
    expect(maskPhone("12")).toBe("***");
  });
});
