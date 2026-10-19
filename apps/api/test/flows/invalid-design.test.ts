import { DesignInvalidDetailsSchema, type DesignProblemCode } from "@giftpop/contracts";
import { describe, expect, it } from "vitest";

import { upsertItem, upsertPrices } from "../../src/modules/catalog/service";

import {
  buildApp,
  itemPrice,
  makeDesign,
  makeItem,
  orderBody,
  orderCount,
  outboxRows,
  postOrder,
  priceRow,
  seedWorld,
  useFlowDatabase,
} from "./helpers";

useFlowDatabase();
const app = buildApp();

async function expectRejected(
  body: Record<string, unknown>,
  expected: { code: DesignProblemCode; itemId: string },
) {
  const res = await postOrder(app, body);

  expect(res.status, JSON.stringify(res.body)).toBe(422);
  expect(res.body.error.code).toBe("DESIGN_INVALID");
  const details = DesignInvalidDetailsSchema.parse(res.body.error.details);
  expect(details.problems).toContainEqual(
    expect.objectContaining({ code: expected.code, itemId: expected.itemId }),
  );
  expect(await orderCount()).toBe(0);
  expect(await outboxRows()).toHaveLength(0);
}

describe("orders with a design that cannot be made", () => {
  it("rejects an inactive item with ITEM_UNAVAILABLE and stores nothing", async () => {
    const { packaging, bar, soap } = await seedWorld();
    await upsertItem({ ...soap, active: false });

    await expectRejected(
      orderBody(
        makeDesign(packaging, [
          [bar, 1],
          [soap, 1],
        ]),
      ),
      { code: "ITEM_UNAVAILABLE", itemId: soap.id },
    );
  });

  it("rejects an item with no price in the country with ITEM_UNAVAILABLE and stores nothing", async () => {
    const { packaging, bar } = await seedWorld();
    const unpriced = await upsertItem(makeItem({ name: "Unpriced", sizeUnits: 1 }));

    await expectRejected(
      orderBody(
        makeDesign(packaging, [
          [bar, 1],
          [unpriced, 1],
        ]),
      ),
      { code: "ITEM_UNAVAILABLE", itemId: unpriced.id },
    );
  });

  it("rejects an out-of-stock item with OUT_OF_STOCK and leaves stock alone", async () => {
    const { packaging, bar, soap } = await seedWorld();
    await upsertPrices([itemPrice(soap, "PK", 12_000, false)]);

    await expectRejected(
      orderBody(
        makeDesign(packaging, [
          [bar, 1],
          [soap, 1],
        ]),
      ),
      { code: "OUT_OF_STOCK", itemId: soap.id },
    );
    expect(await priceRow("item", bar, "PK")).toMatchObject({ inStock: true });
  });

  it("reports every problem at once", async () => {
    const { packaging, bar, soap } = await seedWorld();
    await upsertItem({ ...bar, active: false });
    await upsertPrices([itemPrice(soap, "PK", 12_000, false)]);

    const res = await postOrder(
      app,
      orderBody(
        makeDesign(packaging, [
          [bar, 1],
          [soap, 1],
        ]),
      ),
    );

    expect(res.status).toBe(422);
    const details = DesignInvalidDetailsSchema.parse(res.body.error.details);
    const codes = details.problems.map((p) => p.code);
    expect(codes).toContain("ITEM_UNAVAILABLE");
    expect(codes).toContain("OUT_OF_STOCK");
    expect(await orderCount()).toBe(0);
  });
});
