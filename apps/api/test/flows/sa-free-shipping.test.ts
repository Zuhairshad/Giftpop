import type { PaymentMode } from "@giftpop/contracts";
import { describe, expect, it } from "vitest";

import { upsertCountry } from "../../src/modules/countries/service";

import {
  buildApp,
  makeCountry,
  makeDesign,
  orderBody,
  placeOrder,
  seedWorld,
  useFlowDatabase,
} from "./helpers";

useFlowDatabase();
const app = buildApp();

const SA = {
  code: "SA",
  name: "Saudi Arabia",
  currency: "SAR",
  shipping: { flatMinor: 2_500, freeOverMinor: 22_000, deliveryDays: { min: 2, max: 4 } },
  addressFormat: {
    region: { required: true, label: "Region" },
    postalCode: { required: false, label: "Postcode" },
  },
};
const SA_ADDRESS = { line1: "King Fahd Rd", city: "Riyadh", region: "Riyadh" };

// goods = 10_000 box + 2 x 5_000 bars + 2_000 soap = 22_000 (before any discount)
async function saWorld(freeOverMinor: number) {
  const world = await seedWorld({
    country: { ...SA, shipping: { ...SA.shipping, freeOverMinor } },
    packagingPriceMinor: 10_000,
    barPriceMinor: 5_000,
    soapPriceMinor: 2_000,
  });
  const design = makeDesign(world.packaging, [
    [world.bar, 2],
    [world.soap, 1],
  ]);
  return { world, design };
}

async function quoteFor(mode: PaymentMode, design: ReturnType<typeof makeDesign>) {
  const created = await placeOrder(
    app,
    orderBody(design, { country: "SA", mode, address: SA_ADDRESS }),
  );
  return created.quote;
}

describe("SA free-shipping threshold", () => {
  it("makes shipping free when goods exactly reach the threshold, in both payment modes", async () => {
    const { design } = await saWorld(22_000);

    expect(await quoteFor("cod", design)).toMatchObject({
      goodsMinor: 22_000,
      shippingMinor: 0,
      discountMinor: 0,
      totalMinor: 22_000,
      dueNowMinor: 4_400,
      dueOnDeliveryMinor: 17_600,
    });
    expect(await quoteFor("prepaid", design)).toMatchObject({
      goodsMinor: 22_000,
      shippingMinor: 0,
      discountMinor: 0,
      totalMinor: 22_000,
      dueNowMinor: 22_000,
    });
  });

  it("charges flat shipping one unit below the threshold, in both payment modes", async () => {
    const { design } = await saWorld(22_001);

    expect(await quoteFor("cod", design)).toMatchObject({
      shippingMinor: 2_500,
      totalMinor: 24_500,
      dueNowMinor: 4_900,
      dueOnDeliveryMinor: 19_600,
    });
    expect(await quoteFor("prepaid", design)).toMatchObject({
      shippingMinor: 2_500,
      discountMinor: 0,
      totalMinor: 24_500,
      dueNowMinor: 24_500,
    });
  });

  it("uses the goods total before the prepaid discount, so the mode never changes shipping", async () => {
    // Goods 22_000 reach 21_000; after the 20% discount they would be 17_600 (below it).
    const { design } = await saWorld(21_000);

    const prepaid = await quoteFor("prepaid", design);
    const cod = await quoteFor("cod", design);

    expect(prepaid.shippingMinor).toBe(0);
    expect(cod.shippingMinor).toBe(0);
  });

  it("follows the country's data: raising the threshold later charges shipping", async () => {
    const { design } = await saWorld(22_000);
    expect((await quoteFor("cod", design)).shippingMinor).toBe(0);

    await upsertCountry(
      makeCountry({ ...SA, shipping: { ...SA.shipping, freeOverMinor: 30_000 } }),
    );

    expect((await quoteFor("cod", design)).shippingMinor).toBe(2_500);
  });
});
