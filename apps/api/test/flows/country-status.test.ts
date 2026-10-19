import { describe, expect, it } from "vitest";

import {
  buildApp,
  makeDesign,
  orderBody,
  orderCount,
  outboxRows,
  postOrder,
  postQuote,
  seedWorld,
  useFlowDatabase,
} from "./helpers";

useFlowDatabase();
const app = buildApp();

describe("coming-soon and unknown countries", () => {
  it("rejects quotes for a coming-soon country with 422", async () => {
    const { packaging, bar, soap } = await seedWorld({ country: { status: "coming_soon" } });
    const design = makeDesign(packaging, [
      [bar, 1],
      [soap, 1],
    ]);

    const res = await postQuote(app, "PK", design);

    expect(res.status).toBe(422);
  });

  it("rejects orders for a coming-soon country with 422 and stores nothing", async () => {
    const { packaging, bar, soap } = await seedWorld({ country: { status: "coming_soon" } });
    const design = makeDesign(packaging, [
      [bar, 1],
      [soap, 1],
    ]);

    const res = await postOrder(app, orderBody(design));

    expect(res.status).toBe(422);
    expect(await orderCount()).toBe(0);
    expect(await outboxRows()).toHaveLength(0);
  });

  it("answers an unknown country with 404 for quotes and orders", async () => {
    const { packaging, bar, soap } = await seedWorld();
    const design = makeDesign(packaging, [
      [bar, 1],
      [soap, 1],
    ]);

    const quote = await postQuote(app, "ZZ", design);
    const order = await postOrder(app, orderBody(design, { country: "ZZ" }));

    expect(quote.status).toBe(404);
    expect(order.status).toBe(404);
    expect(await orderCount()).toBe(0);
  });
});
