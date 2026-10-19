import type { Asset, ColourOption, Item, Packaging } from "@giftpop/contracts";
import { model, Schema, type Types } from "mongoose";

/**
 * Stored shapes: the contract shape with `id` swapped for Mongo's `_id`.
 * Optional contract fields stay optional, so absent means absent (never null).
 */
export type ItemDoc = Omit<Item, "id"> & { _id: Types.ObjectId };
export type PackagingDoc = Omit<Packaging, "id"> & { _id: Types.ObjectId };

export interface CountryPriceDoc {
  country: string;
  kind: "item" | "packaging";
  /** The item id or packaging id, depending on `kind`. */
  targetId: Types.ObjectId;
  priceMinor: number;
  inStock: boolean;
  /** Units left when stock is counted; absent when only `inStock` decides. */
  stockQty?: number;
}

/** Image metadata only; the file itself lives in object storage. */
const assetSchema = new Schema<Asset>(
  {
    url: { type: String, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    anchor: {
      x: { type: Number, required: true },
      y: { type: Number, required: true },
    },
  },
  { _id: false },
);

const colourSchema = new Schema<ColourOption>(
  { name: { type: String, required: true }, hex: { type: String, required: true } },
  { _id: false },
);

const itemSchema = new Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    shape: { type: String, required: true },
    color: { type: String, required: true },
    sizeUnits: { type: Number, required: true },
    personalizable: { type: Boolean, required: true },
    personalizationMaxLength: { type: Number },
    image: { type: assetSchema },
    active: { type: Boolean, required: true },
    sortOrder: { type: Number, default: 0 },
  },
  { versionKey: false, collection: "items" },
);
itemSchema.index({ active: 1, category: 1, sortOrder: 1 });
itemSchema.index({ name: 1 });

const packagingSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    kind: { type: String, default: "box" },
    layoutType: { type: String, required: true },
    minItems: { type: Number, required: true },
    maxItems: { type: Number, required: true },
    capacityUnits: { type: Number, required: true },
    wrapperColors: { type: [colourSchema], default: [] },
    ribbonColors: { type: [colourSchema], default: [] },
    layers: {
      back: { type: assetSchema },
      front: { type: assetSchema },
    },
    active: { type: Boolean, required: true },
    sortOrder: { type: Number, default: 0 },
  },
  { versionKey: false, collection: "packagings" },
);
packagingSchema.index({ active: 1, sortOrder: 1 });

const countryPriceSchema = new Schema(
  {
    country: { type: String, required: true, uppercase: true },
    kind: { type: String, required: true, enum: ["item", "packaging"] },
    targetId: { type: Schema.Types.ObjectId, required: true },
    priceMinor: { type: Number, required: true },
    inStock: { type: Boolean, required: true },
    stockQty: { type: Number, min: 0 },
  },
  { versionKey: false, collection: "countryPrices" },
);
// One price per item or packaging per country. The prefix also serves the public
// catalog query (country, kind).
countryPriceSchema.index({ country: 1, kind: 1, targetId: 1 }, { unique: true });
// Admin price grid: every country for one item or packaging.
countryPriceSchema.index({ kind: 1, targetId: 1 });

/** List order for items and packagings: staff-set order, then name, then id for a stable tie-break. */
export const CATALOG_SORT = { sortOrder: 1, name: 1, _id: 1 } as const;

export const ItemModel = model<ItemDoc>("Item", itemSchema);
export const PackagingModel = model<PackagingDoc>("Packaging", packagingSchema);
export const CountryPriceModel = model<CountryPriceDoc>("CountryPrice", countryPriceSchema);
