// Test helpers for the catalog tests. Not imported by app code.
import type { Item, Packaging } from "@giftpop/contracts";
import { Types } from "mongoose";

import { CountryModel } from "../countries/model";

import { CountryPriceModel, ItemModel, PackagingModel } from "./model";

function newId(): string {
  return new Types.ObjectId().toHexString();
}

export function makeItem(overrides: Partial<Item> = {}): Item {
  return {
    id: newId(),
    name: "Dark chocolate bar",
    category: "chocolates",
    shape: "bar",
    color: "#4a2c1a",
    sizeUnits: 1,
    personalizable: false,
    active: true,
    sortOrder: 0,
    ...overrides,
  };
}

export function makePackaging(overrides: Partial<Packaging> = {}): Packaging {
  return {
    id: newId(),
    slug: `bouquet-${newId().slice(-6)}`,
    name: "Bouquet",
    description: "",
    kind: "box",
    layoutType: "bouquet-fan",
    minItems: 6,
    maxItems: 10,
    capacityUnits: 12,
    wrapperColors: [{ name: "Kraft", hex: "#c9a977" }],
    ribbonColors: [{ name: "Red", hex: "#c0392b" }],
    layers: {},
    active: true,
    sortOrder: 0,
    ...overrides,
  };
}

/** Make sure unique indexes exist before a test relies on them. */
export async function initCatalogModels(): Promise<void> {
  await Promise.all([
    CountryModel.init(),
    ItemModel.init(),
    PackagingModel.init(),
    CountryPriceModel.init(),
  ]);
}

function withoutId<T extends { id: string }>(value: T): Omit<T, "id"> {
  const { id, ...rest } = value;
  void id;
  return rest;
}

/** A save request: the item without its server-made id. */
export function itemBody(overrides: Partial<Item> = {}): Omit<Item, "id"> {
  return withoutId(makeItem(overrides));
}
export function packagingBody(overrides: Partial<Packaging> = {}): Omit<Packaging, "id"> {
  return withoutId(makePackaging(overrides));
}
