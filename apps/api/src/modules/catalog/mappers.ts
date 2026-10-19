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
    active: item.active,
    sortOrder: item.sortOrder,
  };
}

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
    active: doc.active,
    sortOrder: doc.sortOrder,
  };
}

export function toPackagingDoc(packaging: Packaging): PackagingDoc {
  const { id, layers, ...rest } = packaging;
  return {
    ...rest,
    _id: toObjectId(id),
    layers: {
      ...(layers.back && { back: layers.back }),
      ...(layers.front && { front: layers.front }),
    },
  };
}

export function toPackaging(doc: PackagingDoc): Packaging {
  const { _id, layers, ...rest } = doc;
  return {
    ...rest,
    id: _id.toHexString(),
    description: doc.description,
    // Mongoose drops empty objects, so a packaging with no layers comes back without `layers`.
    layers: {
      ...(layers?.back && { back: layers.back }),
      ...(layers?.front && { front: layers.front }),
    },
  };
}

export function toPriceEntry(doc: CountryPriceDoc): PriceEntry {
  return { country: doc.country, priceMinor: doc.priceMinor, inStock: doc.inStock };
}

export function toPriceDoc(price: CountryPrice): CountryPriceDoc {
  return {
    country: price.country,
    kind: price.kind,
    targetId: toObjectId(price.kind === "item" ? price.itemId : price.packagingId),
    priceMinor: price.priceMinor,
    inStock: price.inStock,
  };
}
