import { z } from "zod";

import { CountryCodeSchema, HexColorSchema, ObjectIdSchema } from "./common";
import { CurrencyCodeSchema, MinorUnitsSchema } from "./money";

/** Stored in object storage, never in MongoDB. Anchor is where the item sits in a slot, 0 to 1. */
export const AssetSchema = z.object({
  url: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  anchor: z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) }),
});
export type Asset = z.infer<typeof AssetSchema>;

export const ITEM_SHAPES = [
  "bar",
  "bottle",
  "jar",
  "box",
  "mug",
  "flower",
  "card",
  "soft-toy",
  "balloon",
  "other",
] as const;
export const ItemShapeSchema = z.enum(ITEM_SHAPES);
export type ItemShape = z.infer<typeof ItemShapeSchema>;

export const ColourOptionSchema = z.object({
  name: z.string().min(1).max(40),
  hex: HexColorSchema,
});
export type ColourOption = z.infer<typeof ColourOptionSchema>;

/**
 * `layoutType` names a layout function registered in `@giftpop/renderer`.
 * It is a plain string here so a new layout type needs no contract change.
 */
export const LayoutTypeSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export type LayoutType = z.infer<typeof LayoutTypeSchema>;

export const PackagingSchema = z
  .object({
    id: ObjectIdSchema,
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    name: z.string().min(1).max(80),
    description: z.string().max(500).default(""),
    layoutType: LayoutTypeSchema,
    minItems: z.number().int().positive(),
    maxItems: z.number().int().positive(),
    capacityUnits: z.number().int().positive(),
    wrapperColors: z.array(ColourOptionSchema).min(1),
    ribbonColors: z.array(ColourOptionSchema).min(1),
    layers: z.object({ back: AssetSchema.optional(), front: AssetSchema.optional() }).default({}),
    active: z.boolean(),
    sortOrder: z.number().int().default(0),
  })
  .refine((p) => p.minItems <= p.maxItems, {
    message: "minItems must not exceed maxItems",
    path: ["minItems"],
  });
export type Packaging = z.infer<typeof PackagingSchema>;

export const ItemSchema = z
  .object({
    id: ObjectIdSchema,
    name: z.string().min(1).max(80),
    category: z.string().min(1).max(40),
    shape: ItemShapeSchema,
    color: HexColorSchema,
    sizeUnits: z.number().int().positive(),
    personalizable: z.boolean(),
    /** Required when `personalizable`. */
    personalizationMaxLength: z.number().int().positive().max(40).optional(),
    image: AssetSchema.optional(),
    active: z.boolean(),
    sortOrder: z.number().int().default(0),
  })
  .refine((item) => !item.personalizable || item.personalizationMaxLength !== undefined, {
    message: "personalizationMaxLength is required for personalizable items",
    path: ["personalizationMaxLength"],
  });
export type Item = z.infer<typeof ItemSchema>;

const PriceBaseSchema = z.object({
  country: CountryCodeSchema,
  priceMinor: MinorUnitsSchema.nonnegative(),
  inStock: z.boolean(),
});

/** A price row: one per item or packaging per country, in that country's currency. */
export const CountryPriceSchema = z.discriminatedUnion("kind", [
  PriceBaseSchema.extend({ kind: z.literal("item"), itemId: ObjectIdSchema }),
  PriceBaseSchema.extend({ kind: z.literal("packaging"), packagingId: ObjectIdSchema }),
]);
export type CountryPrice = z.infer<typeof CountryPriceSchema>;

export const PricedPackagingSchema = z.object({
  packaging: PackagingSchema,
  priceMinor: MinorUnitsSchema.nonnegative(),
  inStock: z.boolean(),
});
export type PricedPackaging = z.infer<typeof PricedPackagingSchema>;

export const PricedItemSchema = z.object({
  item: ItemSchema,
  priceMinor: MinorUnitsSchema.nonnegative(),
  inStock: z.boolean(),
});
export type PricedItem = z.infer<typeof PricedItemSchema>;

/**
 * Everything sellable in one country: only packagings and items that have a
 * price row there. Built by the API from the database; used by the builder
 * and by `validateDesign`.
 */
export const CountryCatalogSchema = z.object({
  country: CountryCodeSchema,
  currency: CurrencyCodeSchema,
  packagings: z.array(PricedPackagingSchema),
  items: z.array(PricedItemSchema),
});
export type CountryCatalog = z.infer<typeof CountryCatalogSchema>;
