import type { CountryPrice, Item, Packaging, PriceEntry } from "@giftpop/contracts";
import { Types } from "mongoose";

import type { CountryPriceDoc, ItemDoc, PackagingDoc } from "./model";

export function toObjectId(id: string): Types.ObjectId {
  return new Types.ObjectId(id);
}

/** Stored shape for an item. Optional fields are left out, never written as undefined. */
export function toItemDoc(item: Item): ItemDoc {
  return {
    _id: toObjectId(item.id),
    name: item.name,
    category: item.category,
    shape: item.shape,
    color: item.color,
    sizeUnits: item.sizeUnits,
    personalizable: item.personalizable,
    ...(item.personalizationMaxLength !== undefined && {
      personalizationMaxLength: item.personalizationMaxLength,
    }),
    ...(item.image && { image: item.image }),
    pickerStyle: item.pickerStyle ?? "tile",
    active: item.active,
    sortOrder: item.sortOrder,
  };
}

/** Lean reads skip schema defaults, so an item saved before `pickerStyle` existed reads as "tile". */
export function toItem(doc: ItemDoc): Item {
  return {
    id: doc._id.toHexString(),
    name: doc.name,
    category: doc.category,
    shape: doc.shape,
    color: doc.color,
    sizeUnits: doc.sizeUnits,
    personalizable: doc.personalizable,
    ...(doc.personalizationMaxLength !== undefined && {
      personalizationMaxLength: doc.personalizationMaxLength,
    }),
    ...(doc.image && { image: doc.image }),
    pickerStyle: doc.pickerStyle ?? "tile",
    active: doc.active,
    sortOrder: doc.sortOrder,
  };
}

/** Only the layers that exist, so absent means absent. */
function presentLayers(layers: Partial<Packaging["layers"]> | undefined): Packaging["layers"] {
  return {
    ...(layers?.back && { back: layers.back }),
    ...(layers?.front && { front: layers.front }),
  };
}

export function toPackagingDoc(packaging: Packaging): PackagingDoc {
  const { id, layers, ...rest } = packaging;
  return { ...rest, _id: toObjectId(id), layers: presentLayers(layers) };
}

/**
 * Lean reads skip schema defaults, so a packaging saved before `kind` existed
 * comes back without one. It reads as "box" (docs/product.md).
 */
type StoredPackagingDoc = Omit<PackagingDoc, "kind"> & Partial<Pick<PackagingDoc, "kind">>;

export function toPackaging(doc: StoredPackagingDoc): Packaging {
  const { _id, layers, kind, ...rest } = doc;
  // Mongoose drops empty objects, so a packaging with no layers comes back without `layers`.
  return { ...rest, id: _id.toHexString(), kind: kind ?? "box", layers: presentLayers(layers) };
}

export function toPriceEntry(doc: CountryPriceDoc): PriceEntry {
  return {
    country: doc.country,
    priceMinor: doc.priceMinor,
    inStock: doc.inStock,
    ...(doc.stockQty === undefined || doc.stockQty === null ? {} : { stockQty: doc.stockQty }),
  };
}

export function toPriceDoc(price: CountryPrice): CountryPriceDoc {
  return {
    country: price.country,
    kind: price.kind,
    targetId: toObjectId(price.kind === "item" ? price.itemId : price.packagingId),
    priceMinor: price.priceMinor,
    inStock: price.inStock,
    ...(price.stockQty === undefined ? {} : { stockQty: price.stockQty }),
  };
}
