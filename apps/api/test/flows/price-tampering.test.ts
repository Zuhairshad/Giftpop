import { describe, expect, it } from "vitest";

import {
  buildApp,
  makeDesign,
  orderBody,
  placeOrder,
  seedWorld,
  storedOrder,
  useFlowDatabase,
} from "./helpers";

useFlowDatabase();
const app = buildApp();

describe("price tampering", () => {
  it("ignores every client-sent price and stores the server's quote and snapshots", async () => {
    const { packaging, bar, soap } = await seedWorld();
    const design = makeDesign(packaging, [
      [bar, 2],
      [soap, 1],
    ]);
    const clean = await placeOrder(app, orderBody(design));

    const tamperedDesign = {
      ...design,
      totalMinor: 1,
      priceMinor: 1,
      packagingPriceMinor: 1,
      items: design.items.map((line) => ({ ...line, priceMinor: 1, unitPriceMinor: 1 })),
    };
    const tamperedBody = {
      ...orderBody(tamperedDesign),
      totalMinor: 1,
      goodsMinor: 1,
      priceMinor: 1,
      shippingMinor: 0,
      discountMinor: 999_999,
      dueNowMinor: 1,
      quote: { ...clean.quote, totalMinor: 1, dueNowMinor: 1, discountMinor: 999_999 },
      items: [{ itemId: bar.id, qty: 1, unitPriceMinor: 1 }],
      packaging: { packagingId: packaging.id, priceMinor: 1 },
    };
    const tampered = await placeOrder(app, tamperedBody);

    expect(tampered.quote).toEqual(clean.quote);
    const stored = await storedOrder(tampered.number);
    expect(stored.quote).toEqual(clean.quote);
    expect(stored.packaging.priceMinor).toBe(90_000);
    const prices = new Map(stored.items.map((i) => [i.itemId, i.unitPriceMinor]));
    expect(prices.get(bar.id)).toBe(45_000);
    expect(prices.get(soap.id)).toBe(12_000);
    // Nothing the client invented is stored in the design JSON.
    expect(JSON.stringify(stored.design)).not.toContain("priceMinor");
    expect(JSON.stringify(stored.design)).not.toContain("totalMinor");
  });

  it("ignores a price sent inside the contact or address objects too", async () => {
    const { packaging, bar, soap } = await seedWorld();
    const design = makeDesign(packaging, [
      [bar, 1],
      [soap, 1],
    ]);
    const base = orderBody(design);
    const clean = await placeOrder(app, base);

    const tampered = await placeOrder(app, {
      ...base,
      contact: { ...(base["contact"] as object), priceMinor: 1 },
      address: { ...(base["address"] as object), totalMinor: 1 },
    });

    expect(tampered.quote).toEqual(clean.quote);
  });
});
