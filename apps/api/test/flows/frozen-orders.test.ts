import { PublicOrderViewSchema } from "@giftpop/contracts";
import { describe, expect, it } from "vitest";

import { upsertItem, upsertPackaging, upsertPrices } from "../../src/modules/catalog/service";

import {
  buildApp,
  itemPrice,
  makeDesign,
  orderBody,
  placeOrder,
  seedWorld,
  storedOrder,
  trackOrder,
  useFlowDatabase,
} from "./helpers";

useFlowDatabase();
const app = buildApp();

describe("frozen orders", () => {
  it("keep the original snapshots and quote after the catalog changes", async () => {
    const { packaging, bar, soap } = await seedWorld();
    const design = makeDesign(packaging, [
      [bar, 2],
      [soap, 1],
    ]);
    const created = await placeOrder(app, orderBody(design));
    const before = await storedOrder(created.number);

    // Staff change everything about what was ordered.
    await upsertItem({ ...bar, name: "Renamed bar", active: false });
    await upsertItem({ ...soap, name: "Renamed soap", active: false });
    await upsertPrices([
      itemPrice(bar, "PK", 1),
      itemPrice(soap, "PK", 1),
      { kind: "packaging", packagingId: packaging.id, country: "PK", priceMinor: 1, inStock: true },
    ]);
    await upsertPackaging({ ...packaging, name: "Renamed box", active: false });

    const after = await storedOrder(created.number);
    expect(after.quote).toEqual(before.quote);
    expect(after.quote.goodsMinor).toBe(192_000);
    expect(after.design).toEqual(before.design);
    expect(after.packaging).toEqual(before.packaging);
    expect(after.packaging.name).toBe("Box");
    expect(after.packaging.priceMinor).toBe(90_000);
    expect(after.items).toEqual(before.items);
    const byId = new Map(after.items.map((i) => [i.itemId, i]));
    expect(byId.get(bar.id)).toMatchObject({ name: "Bar", unitPriceMinor: 45_000, qty: 2 });
    expect(byId.get(soap.id)).toMatchObject({ name: "Soap", unitPriceMinor: 12_000, qty: 1 });

    const res = await trackOrder(app, created.number, "sara@example.com");
    expect(res.status).toBe(200);
    const view = PublicOrderViewSchema.parse(res.body);
    expect(view.quote).toEqual(before.quote);
    expect(view.packaging.name).toBe("Box");
    expect(view.packaging.priceMinor).toBe(90_000);
    expect(view.items.map((i) => [i.name, i.unitPriceMinor, i.qty]).sort()).toEqual([
      ["Bar", 45_000, 2],
      ["Soap", 12_000, 1],
    ]);
  });
});
