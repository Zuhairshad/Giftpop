import { randomUUID } from "node:crypto";

import { describe, expect, it } from "vitest";

import { upsertPrices } from "../../src/modules/catalog/service";

import {
  buildApp,
  itemPrice,
  makeDesign,
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

describe("idempotency", () => {
  it("returns the same order number for the same key and body, and stores one order", async () => {
    const { packaging, bar, soap } = await seedWorld();
    await upsertPrices([{ ...itemPrice(bar, "PK", 45_000), stockQty: 5 }]);
    const body = orderBody(
      makeDesign(packaging, [
        [bar, 1],
        [soap, 1],
      ]),
    );
    const key = randomUUID();

    const first = await postOrder(app, body, key);
    const second = await postOrder(app, body, key);

    expect(first.status).toBe(201);
    expect(second.status).toBeLessThan(300);
    expect(second.body.number).toBe(first.body.number);
    expect(await orderCount()).toBe(1);
    // The replay did not take stock a second time.
    expect(await priceRow("item", bar, "PK")).toMatchObject({ stockQty: 4 });
    expect(await outboxRows("order_created")).toHaveLength(1);
  });

  it("answers 409 for the same key with a different body, and stores no second order", async () => {
    const { packaging, bar, soap } = await seedWorld();
    const design = makeDesign(packaging, [
      [bar, 1],
      [soap, 1],
    ]);
    const key = randomUUID();

    const first = await postOrder(app, orderBody(design), key);
    const second = await postOrder(
      app,
      orderBody({
        ...design,
        personalisation: { ...design.personalisation, recipientName: "Someone else" },
      }),
      key,
    );

    expect(first.status).toBe(201);
    expect(second.status).toBe(409);
    expect(await orderCount()).toBe(1);
  });

  it("gives different keys different orders", async () => {
    const { packaging, bar, soap } = await seedWorld();
    const body = orderBody(
      makeDesign(packaging, [
        [bar, 1],
        [soap, 1],
      ]),
    );

    const a = await postOrder(app, body, randomUUID());
    const b = await postOrder(app, body, randomUUID());

    expect(a.body.number).not.toBe(b.body.number);
    expect(await orderCount()).toBe(2);
  });
});

describe("stock", () => {
  it("lets one of two simultaneous orders for the last unit win; the other gets 409", async () => {
    const { packaging, bar, soap } = await seedWorld();
    await upsertPrices([{ ...itemPrice(bar, "PK", 45_000), stockQty: 1 }]);
    const body = orderBody(
      makeDesign(packaging, [
        [bar, 1],
        [soap, 1],
      ]),
    );

    const results = await Promise.all([
      postOrder(app, body, randomUUID()),
      postOrder(app, body, randomUUID()),
    ]);

    // The loser is refused at the stock update (409) or, if the winner already committed when it
    // validates, as an out-of-stock design (422). Both leave nothing behind.
    const statuses = results.map((r) => r.status).sort();
    expect(statuses[0], JSON.stringify(results.map((r) => r.body))).toBe(201);
    expect([409, 422]).toContain(statuses[1]);
    expect(await orderCount()).toBe(1);
    expect(await priceRow("item", bar, "PK")).toMatchObject({ stockQty: 0, inStock: false });
    // The loser's transaction rolled back, so it left no notification either.
    expect(await outboxRows("order_created")).toHaveLength(1);
  });

  it("answers 409 and changes nothing when an order wants more than is left", async () => {
    const { packaging, bar, soap } = await seedWorld();
    await upsertPrices([{ ...itemPrice(bar, "PK", 45_000), stockQty: 1 }]);

    const res = await postOrder(
      app,
      orderBody(
        makeDesign(packaging, [
          [bar, 2],
          [soap, 1],
        ]),
      ),
    );

    expect(res.status).toBe(409);
    expect(await orderCount()).toBe(0);
    expect(await priceRow("item", bar, "PK")).toMatchObject({ stockQty: 1, inStock: true });
    expect(await priceRow("item", soap, "PK")).toMatchObject({ inStock: true });
  });

  it("takes stock off every line of a successful order", async () => {
    const { packaging, bar, soap } = await seedWorld();
    await upsertPrices([
      { ...itemPrice(bar, "PK", 45_000), stockQty: 10 },
      { ...itemPrice(soap, "PK", 12_000), stockQty: 3 },
    ]);

    const res = await postOrder(
      app,
      orderBody(
        makeDesign(packaging, [
          [bar, 3],
          [soap, 1],
        ]),
      ),
    );

    expect(res.status).toBe(201);
    expect(await priceRow("item", bar, "PK")).toMatchObject({ stockQty: 7 });
    expect(await priceRow("item", soap, "PK")).toMatchObject({ stockQty: 2 });
  });
});
