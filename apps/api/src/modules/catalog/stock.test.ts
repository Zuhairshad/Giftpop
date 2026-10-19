import type { CountryPrice } from "@giftpop/contracts";
import mongoose, { Types } from "mongoose";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { clearDatabase, useTestMongo } from "../../../test/mongo";

import { initCatalogModels } from "./fixtures";
import { CountryPriceModel } from "./model";
import { upsertPrices, listPrices } from "./prices.service";
import { releaseStock, reserveStock } from "./stock.service";

useTestMongo();
beforeAll(initCatalogModels);
beforeEach(clearDatabase);

const itemId = new Types.ObjectId().toHexString();
const price = (over: Partial<CountryPrice> = {}): CountryPrice =>
  ({
    kind: "item",
    itemId,
    country: "PK",
    priceMinor: 1000,
    inStock: true,
    ...over,
  }) as CountryPrice;
const line = (qty: number) => ({ kind: "item" as const, targetId: itemId, country: "PK", qty });
const stored = async () => (await listPrices("item", itemId)).prices[0];

describe("reserveStock", () => {
  it("takes counted units off and puts the row off sale at zero", async () => {
    await upsertPrices([price({ stockQty: 3 })]);
    await reserveStock([line(2)]);
    expect(await stored()).toMatchObject({ stockQty: 1, inStock: true });
    await reserveStock([line(1)]);
    expect(await stored()).toMatchObject({ stockQty: 0, inStock: false });
  });

  it("refuses more than is left with 409 and changes nothing", async () => {
    await upsertPrices([price({ stockQty: 2 })]);
    await expect(reserveStock([line(3)])).rejects.toMatchObject({
      httpStatus: 409,
      code: "CONFLICT",
    });
    expect(await stored()).toMatchObject({ stockQty: 2, inStock: true });
  });

  it("lets only one of two concurrent orders for the last unit win", async () => {
    await upsertPrices([price({ stockQty: 1 })]);
    const results = await Promise.allSettled([reserveStock([line(1)]), reserveStock([line(1)])]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((r) => r.status === "rejected")).toHaveLength(1);
    expect(await stored()).toMatchObject({ stockQty: 0, inStock: false });
  });

  it("refuses a row that is marked out of stock, and a missing row", async () => {
    await upsertPrices([price({ inStock: false })]);
    await expect(reserveStock([line(1)])).rejects.toMatchObject({ httpStatus: 409 });
    await expect(
      reserveStock([{ ...line(1), targetId: new Types.ObjectId().toHexString() }]),
    ).rejects.toMatchObject({ httpStatus: 409 });
  });

  it("does not count rows without a stock number", async () => {
    await upsertPrices([price()]);
    await reserveStock([line(5)]);
    expect((await stored())?.stockQty).toBeUndefined();
  });

  it("rolls back with the transaction when a later line fails", async () => {
    const other = new Types.ObjectId().toHexString();
    await upsertPrices([
      price({ stockQty: 5 }),
      { ...price({ stockQty: 0, inStock: false }), itemId: other } as CountryPrice,
    ]);
    const session = await mongoose.startSession();
    await expect(
      session.withTransaction(async () => {
        await reserveStock([line(2), { ...line(1), targetId: other }], session);
      }),
    ).rejects.toMatchObject({ httpStatus: 409 });
    await session.endSession();
    expect(await stored()).toMatchObject({ stockQty: 5 });
  });
});

describe("releaseStock", () => {
  it("puts units back and puts a sold-out row on sale again", async () => {
    await upsertPrices([price({ stockQty: 1 })]);
    await reserveStock([line(1)]);
    await releaseStock([line(1)]);
    expect(await stored()).toMatchObject({ stockQty: 1, inStock: true });
  });

  it("does not switch on a row staff turned off while units remained", async () => {
    await upsertPrices([price({ stockQty: 4, inStock: false })]);
    await releaseStock([line(1)]);
    expect(await stored()).toMatchObject({ stockQty: 5, inStock: false });
  });

  it("ignores rows that do not count stock", async () => {
    await upsertPrices([price()]);
    await releaseStock([line(2)]);
    expect((await stored())?.stockQty).toBeUndefined();
    expect(await CountryPriceModel.countDocuments()).toBe(1);
  });
});
