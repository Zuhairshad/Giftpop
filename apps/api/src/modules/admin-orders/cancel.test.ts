import type { CountryPrice } from "@giftpop/contracts";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { clearDatabase, useTestMongo } from "../../../test/mongo";
import { initCatalogModels } from "../catalog/fixtures";
import { listPrices, upsertPrices } from "../catalog/prices.service";
import * as stock from "../catalog/stock.service";
import { orderDocInput } from "../orders/fixtures";
import { OrderModel } from "../orders/model";

import { api, createAdminApp, signIn } from "./admin-orders.test-utils";

vi.mock("../catalog/stock.service", async (importOriginal) => {
  const original = await importOriginal<typeof stock>();
  return { ...original, releaseStock: vi.fn(original.releaseStock) };
});

useTestMongo();
beforeAll(async () => {
  await initCatalogModels();
  await OrderModel.init();
});
beforeEach(async () => {
  await clearDatabase();
  vi.mocked(stock.releaseStock).mockClear();
});

const app = createAdminApp();

async function orderWithStock(itemStock: number, inStock: boolean) {
  const input = orderDocInput({ status: "confirmed" });
  const order = await OrderModel.create(input);
  const itemId = input.items[0]!.itemId;
  const packagingId = input.packaging.packagingId;
  await upsertPrices([
    { kind: "item", itemId, country: "PK", priceMinor: 45_000, inStock, stockQty: itemStock },
    { kind: "packaging", packagingId, country: "PK", priceMinor: 90_000, inStock: true },
  ] as CountryPrice[]);
  return { id: order._id.toHexString(), itemId };
}

const itemRow = async (itemId: string) => (await listPrices("item", itemId)).prices[0];

describe("cancelling an order", () => {
  it("puts the stock back, and re-opens a sold-out row", async () => {
    const session = await signIn(app);
    const { id, itemId } = await orderWithStock(0, false);
    const res = await api(app, session).post(`/${id}/status`, {
      to: "cancelled",
      reason: "Customer changed their mind",
    });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("cancelled");
    expect(await itemRow(itemId)).toMatchObject({ stockQty: 2, inStock: true });
  });

  it("adds to the count of a row that still has units", async () => {
    const session = await signIn(app);
    const { id, itemId } = await orderWithStock(5, true);
    await api(app, session).post(`/${id}/status`, { to: "cancelled", reason: "Duplicate" });
    expect(await itemRow(itemId)).toMatchObject({ stockQty: 7, inStock: true });
  });

  it("does not touch stock for other moves", async () => {
    const session = await signIn(app);
    const { id, itemId } = await orderWithStock(5, true);
    await api(app, session).post(`/${id}/status`, { to: "in_production" });
    expect(await itemRow(itemId)).toMatchObject({ stockQty: 5 });
  });

  it("rolls the cancellation back when putting stock back fails", async () => {
    const session = await signIn(app);
    const { id, itemId } = await orderWithStock(1, true);
    vi.mocked(stock.releaseStock).mockRejectedValueOnce(new Error("disk on fire"));
    const res = await api(app, session).post(`/${id}/status`, {
      to: "cancelled",
      reason: "Duplicate",
    });
    expect(res.status).toBe(500);
    const stored = await OrderModel.findById(id).lean();
    expect(stored?.status).toBe("confirmed");
    expect(stored?.history).toHaveLength(1);
    expect(await itemRow(itemId)).toMatchObject({ stockQty: 1 });
  });
});
