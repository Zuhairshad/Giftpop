import {
  money,
  PAYMENT_POLICY,
  PaymentProofUploadResponseSchema,
  PublicOrderViewSchema,
  QuoteResponseSchema,
} from "@giftpop/contracts";
import request from "supertest";
import { describe, expect, it } from "vitest";

import { recordPayment } from "../../src/modules/payments/service";

import {
  buildApp,
  makeDesign,
  newStaffId,
  orderBody,
  placeOrder,
  postQuote,
  seedWorld,
  storedOrder,
  tinyPng,
  trackOrder,
  useFlowDatabase,
} from "./helpers";

useFlowDatabase();
const app = buildApp();

describe("PK cash on delivery, quote to tracking", () => {
  it("quotes, orders, takes a proof, records the advance and tracks the order", async () => {
    // goods = 90_000 box + 2 x 45_002 bars + 12_000 soap = 192_004; flat shipping 25_000
    // total = 217_004; advance = 20% = 43_400.8 -> 43_401 (half up); rest = 173_603
    const { packaging, bar, soap } = await seedWorld({ barPriceMinor: 45_002 });
    const design = makeDesign(packaging, [
      [bar, 2],
      [soap, 1],
    ]);
    const expectedQuote = {
      currency: "PKR",
      mode: "cod",
      goodsMinor: 192_004,
      discountMinor: 0,
      shippingMinor: 25_000,
      totalMinor: 217_004,
      dueNowMinor: 43_401,
      dueOnDeliveryMinor: 173_603,
    };
    expect(PAYMENT_POLICY.cod.advancePercent).toBe(20);

    // 1. quote
    const quoteRes = await postQuote(app, "PK", design);
    expect(quoteRes.status).toBe(200);
    const quotes = QuoteResponseSchema.parse(quoteRes.body).quotes;
    expect(quotes.find((q) => q.mode === "cod")).toEqual(expectedQuote);

    // 2. order
    const created = await placeOrder(app, orderBody(design, { mode: "cod" }));
    expect(created.number).toMatch(/^GP-PK-[0-9A-HJKMNP-TV-Z]{6}$/);
    expect(created.paymentMode).toBe("cod");
    expect(created.quote).toEqual(expectedQuote);
    expect(created.paymentInstructions).toBe("Bank: 1234 5678 (DEV ONLY)");

    const stored = await storedOrder(created.number);
    expect(stored.status).toBe("awaiting_payment");
    expect(stored.paymentStatus).toBe("unpaid");
    expect(stored.quote).toEqual(expectedQuote);
    expect(stored.history).toHaveLength(1);
    expect(stored.history[0]).toMatchObject({ from: null, to: "awaiting_payment" });

    // 3. proof of payment, with the right contact
    const png = await tinyPng();
    const proofRes = await request(app)
      .post(`/v1/orders/${created.number}/payment-proof`)
      .field("contact", "sara@example.com")
      .attach("file", png, { filename: "proof.png", contentType: "image/png" });
    expect(proofRes.status, JSON.stringify(proofRes.body)).toBeLessThan(300);
    const proof = PaymentProofUploadResponseSchema.parse(proofRes.body).proof;
    expect(proof.status).toBe("pending");
    expect((await storedOrder(created.number)).proofs).toHaveLength(1);

    // 4. staff records exactly the advance
    const staffId = newStaffId();
    const paid = await recordPayment(
      stored._id.toHexString(),
      money(43_401, "PKR"),
      "manual_transfer",
      staffId,
    );
    expect(paid.paymentStatus).toBe("advance_paid");
    expect(paid.status).toBe("confirmed");

    const after = await storedOrder(created.number);
    expect(after.paymentStatus).toBe("advance_paid");
    expect(after.status).toBe("confirmed");
    expect(after.payments).toHaveLength(1);
    expect(after.history).toHaveLength(2);
    expect(after.history[0]).toMatchObject({ from: null, to: "awaiting_payment" });
    expect(after.history[1]).toMatchObject({ from: "awaiting_payment", to: "confirmed" });
    expect(String(after.history[1]?.actorId)).toBe(staffId);

    // 5. the customer tracks with the phone, formatted differently
    const trackRes = await trackOrder(app, created.number, "(92) 300-1234567");
    expect(trackRes.status).toBe(200);
    const view = PublicOrderViewSchema.parse(trackRes.body);
    expect(view.status).toBe("confirmed");
    expect(view.paymentStatus).toBe("advance_paid");
    expect(view.quote).toEqual(expectedQuote);
    expect(view.proofs).toHaveLength(1);
    expect(view.history.map((h) => h.to)).toEqual(["awaiting_payment", "confirmed"]);
    for (const entry of view.history) expect(Object.keys(entry).sort()).toEqual(["at", "to"]);
    const text = JSON.stringify(trackRes.body);
    expect(text).not.toContain(staffId);
    expect(text).not.toContain("actorId");
    expect(text).not.toContain("recordedBy");
  });

  it("rejects a payment proof with the wrong contact and stores nothing", async () => {
    const { packaging, bar, soap } = await seedWorld();
    const design = makeDesign(packaging, [
      [bar, 1],
      [soap, 1],
    ]);
    const created = await placeOrder(app, orderBody(design));

    const res = await request(app)
      .post(`/v1/orders/${created.number}/payment-proof`)
      .field("contact", "someone-else@example.com")
      .attach("file", await tinyPng(), { filename: "proof.png", contentType: "image/png" });

    expect(res.status).toBe(404);
    expect((await storedOrder(created.number)).proofs).toHaveLength(0);
  });

  it("answers an unknown number and a wrong contact with the same 404", async () => {
    const { packaging, bar, soap } = await seedWorld();
    const design = makeDesign(packaging, [
      [bar, 1],
      [soap, 1],
    ]);
    const created = await placeOrder(app, orderBody(design));

    const wrongContact = await trackOrder(app, created.number, "+92 311 0000000");
    const unknownNumber = await trackOrder(app, "GP-PK-ZZZZZZ", "sara@example.com");

    expect(wrongContact.status).toBe(404);
    expect(unknownNumber.status).toBe(404);
    expect(wrongContact.body).toEqual(unknownNumber.body);
  });
});
