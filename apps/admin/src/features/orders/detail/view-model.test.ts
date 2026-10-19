import type { AdminOrderDetail } from "@giftpop/contracts";
import { describe, expect, it } from "vitest";

import {
  actorLabel,
  copyStrategy,
  itemRows,
  noteRows,
  paymentTotals,
  personalisationTexts,
  sceneInput,
  timelineRows,
} from "./view-model";

const id = (n: number) => n.toString(16).padStart(24, "0");

function makeOrder(overrides: Partial<AdminOrderDetail> = {}): AdminOrderDetail {
  return {
    id: id(1),
    number: "GP-PK-7K2M9Q",
    country: "PK",
    contact: { name: "Ayesha", email: "a@example.com", phone: "+92 300 1234567" },
    address: { line1: "1 Street", city: "Lahore" },
    design: {
      packagingId: id(10),
      items: [
        { itemId: id(20), qty: 2, slot: 0 },
        { itemId: id(21), qty: 1, slot: 1 },
      ],
      wrapperColor: "#c8a27a",
      ribbonColor: "#c0392b",
      arrangementSeed: 3,
      personalisation: {
        cardMessage: "Happy birthday",
        recipientName: "Sara",
        itemNames: { [id(21)]: "Sara" },
      },
    },
    packaging: {
      packagingId: id(10),
      name: "Small box",
      layoutType: "grid",
      priceMinor: 50000,
      minItems: 1,
      maxItems: 6,
      capacityUnits: 12,
      layers: {},
    },
    items: [
      {
        itemId: id(20),
        name: "Rose",
        shape: "flower",
        color: "#ff0000",
        sizeUnits: 1,
        unitPriceMinor: 12345,
        qty: 2,
      },
      {
        itemId: id(21),
        name: "Mug",
        shape: "mug",
        color: "#00ff00",
        sizeUnits: 2,
        unitPriceMinor: 999,
        qty: 1,
      },
    ],
    quote: {
      currency: "PKR",
      mode: "cod",
      goodsMinor: 75689,
      discountMinor: 0,
      shippingMinor: 0,
      totalMinor: 75689,
      dueNowMinor: 20000,
      dueOnDeliveryMinor: 55689,
    },
    paymentMode: "cod",
    paymentStatus: "unpaid",
    status: "awaiting_payment",
    history: [
      { from: null, to: "awaiting_payment", at: "2026-10-19T10:00:00.000Z", actorId: null },
    ],
    shipment: null,
    payments: [],
    notes: [],
    proofs: [],
    createdAt: "2026-10-19T10:00:00.000Z",
    updatedAt: "2026-10-19T10:00:00.000Z",
    ...overrides,
  } as AdminOrderDetail;
}

const pay = (
  kind: "advance" | "full" | "balance" | "refund",
  amountMinor: number,
  currency = "PKR",
) => ({
  id: id(Math.floor(Math.random() * 1e6)),
  kind,
  method: "manual_transfer" as const,
  amount: { amountMinor, currency },
  recordedBy: id(5),
  recordedAt: "2026-10-19T11:00:00.000Z",
  recordedByName: "Sam",
});

describe("paymentTotals", () => {
  it("is zero received with no payments", () => {
    expect(paymentTotals(makeOrder())).toMatchObject({ receivedMinor: 0, balanceMinor: 75689 });
  });
  it("sums non-refund payments exactly and ignores refunds and other currencies", () => {
    const order = makeOrder({
      payments: [
        pay("advance", 20001),
        pay("balance", 1),
        pay("refund", 5000),
        pay("full", 100, "USD"),
      ],
    });
    expect(paymentTotals(order)).toMatchObject({ receivedMinor: 20002, balanceMinor: 55687 });
  });
  it("goes negative when overpaid", () => {
    expect(paymentTotals(makeOrder({ payments: [pay("full", 80000)] })).balanceMinor).toBe(-4311);
  });
});

describe("actorLabel", () => {
  it("uses the staff name", () => expect(actorLabel(id(1), "Sam")).toBe("Sam"));
  it("says Customer for the creating entry and System for later automatic ones", () => {
    expect(actorLabel(null, null, null)).toBe("Customer");
    expect(actorLabel(null, null, "confirmed")).toBe("System");
  });
  it("covers a removed staff account", () => {
    expect(actorLabel(id(1), null)).toBe("Former staff member");
    expect(actorLabel(id(1), "  ")).toBe("Former staff member");
  });
});

describe("copyStrategy", () => {
  it("copies when the API is there and the page is secure", () =>
    expect(copyStrategy({ hasClipboard: true, isSecureContext: true })).toBe("clipboard"));
  it("falls back to selecting otherwise", () => {
    expect(copyStrategy({ hasClipboard: false, isSecureContext: true })).toBe("select");
    expect(copyStrategy({ hasClipboard: true, isSecureContext: false })).toBe("select");
  });
});

describe("timelineRows and noteRows", () => {
  it("labels history with words and actors", () => {
    const order = makeOrder({
      history: [
        {
          from: null,
          to: "awaiting_payment",
          at: "2026-10-19T10:00:00.000Z",
          actorId: null,
          actorName: null,
        },
        {
          from: "awaiting_payment",
          to: "confirmed",
          at: "2026-10-19T12:00:00.000Z",
          actorId: id(5),
          actorName: "Sam",
          note: "Paid",
        },
      ],
    });
    const rows = timelineRows(order);
    expect(rows[0]).toMatchObject({
      fromLabel: null,
      toLabel: "Awaiting payment",
      actor: "Customer",
      note: null,
    });
    expect(rows[1]).toMatchObject({
      fromLabel: "Awaiting payment",
      toLabel: "Confirmed",
      actor: "Sam",
      note: "Paid",
    });
  });
  it("sorts notes newest first", () => {
    const order = makeOrder({
      notes: [
        {
          id: id(1),
          text: "old",
          actorId: id(5),
          actorName: "Sam",
          at: "2026-10-19T10:00:00.000Z",
        },
        { id: id(2), text: "new", actorId: id(5), actorName: null, at: "2026-10-19T12:00:00.000Z" },
      ],
    });
    const rows = noteRows(order);
    expect(rows.map((r) => r.text)).toEqual(["new", "old"]);
    expect(rows[0]?.author).toBe("Former staff member");
  });
});

describe("items and personalisation", () => {
  it("multiplies integer snapshot prices by integer quantity", () => {
    expect(itemRows(makeOrder()).map((r) => r.lineMinor)).toEqual([24690, 999]);
  });
  it("lists card, recipient and item names to copy", () => {
    expect(personalisationTexts(makeOrder()).map((t) => t.label)).toEqual([
      "Card message",
      "Recipient name",
      "Name on Mug",
    ]);
  });
  it("skips empty texts", () => {
    const order = makeOrder();
    order.design.personalisation = { cardMessage: " ", recipientName: "", itemNames: {} };
    expect(personalisationTexts(order)).toEqual([]);
  });
});

describe("sceneInput", () => {
  it("builds scene documents from the snapshots only", () => {
    const scene = sceneInput(makeOrder());
    expect(scene.packaging.name).toBe("Small box");
    expect(scene.packaging.layoutType).toBe("grid");
    expect(scene.items.map((i) => i.name)).toEqual(["Rose", "Mug"]);
    expect(scene.packaging.wrapperColors[0]?.hex).toBe("#c8a27a");
  });
});
