import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { clearDatabase, useTestMongo } from "../../../test/mongo";

import { initCatalogModels, makeItem, makePackaging } from "./fixtures";
import { CountryPriceModel, ItemModel, PackagingModel } from "./model";
import { upsertItem, upsertPackaging, upsertPrices } from "./service";

useTestMongo();
beforeAll(initCatalogModels);
beforeEach(clearDatabase);

describe("upsertItem", () => {
  it("is idempotent: running twice leaves one identical document", async () => {
    const item = makeItem({ personalizable: true, personalizationMaxLength: 12 });
    const first = await upsertItem(item);
    const second = await upsertItem(item);
    expect(first).toEqual(item);
    expect(second).toEqual(item);
    expect(await ItemModel.countDocuments()).toBe(1);
  });

  it("replaces the stored item when the same id is saved again", async () => {
    const item = makeItem();
    await upsertItem(item);
    const changed = await upsertItem({ ...item, name: "New name", active: false });
    expect(changed).toMatchObject({ id: item.id, name: "New name", active: false });
    expect(await ItemModel.countDocuments()).toBe(1);
  });
});

describe("upsertPackaging", () => {
  it("is idempotent and returns the stored packaging", async () => {
    const packaging = makePackaging();
    expect(await upsertPackaging(packaging)).toEqual(packaging);
    expect(await upsertPackaging(packaging)).toEqual(packaging);
    expect(await PackagingModel.countDocuments()).toBe(1);
  });

  it("keeps two packagings with different ids apart and rejects a clashing slug", async () => {
    await upsertPackaging(makePackaging({ slug: "box-grid" }));
    await expect(upsertPackaging(makePackaging({ slug: "box-grid" }))).rejects.toMatchObject({
      code: 11000,
    });
    expect(await PackagingModel.countDocuments()).toBe(1);
  });
});

describe("upsertPrices", () => {
  it("is idempotent, keyed by country, kind and target id", async () => {
    const item = await upsertItem(makeItem());
    const box = await upsertPackaging(makePackaging());
    const rows = [
      { kind: "item" as const, itemId: item.id, country: "PK", priceMinor: 100, inStock: true },
      { kind: "item" as const, itemId: item.id, country: "GB", priceMinor: 5, inStock: true },
      {
        kind: "packaging" as const,
        packagingId: box.id,
        country: "PK",
        priceMinor: 900,
        inStock: true,
      },
    ];
    await upsertPrices(rows);
    await upsertPrices(rows);
    expect(await CountryPriceModel.countDocuments()).toBe(3);

    await upsertPrices([{ ...rows[0]!, priceMinor: 120, inStock: false }]);
    expect(await CountryPriceModel.countDocuments()).toBe(3);
    const stored = await CountryPriceModel.findOne({ country: "PK", kind: "item" }).lean();
    expect(stored).toMatchObject({ priceMinor: 120, inStock: false });
  });

  it("accepts an empty list", async () => {
    await expect(upsertPrices([])).resolves.toBeUndefined();
  });

  it("enforces one row per country and target at the database level", async () => {
    const item = await upsertItem(makeItem());
    await upsertPrices([
      { kind: "item", itemId: item.id, country: "PK", priceMinor: 1, inStock: true },
    ]);
    const duplicate = {
      country: "PK",
      kind: "item" as const,
      targetId: (await CountryPriceModel.findOne().lean())?.targetId,
      priceMinor: 2,
      inStock: true,
    };
    await expect(CountryPriceModel.create(duplicate)).rejects.toMatchObject({ code: 11000 });
  });
});
