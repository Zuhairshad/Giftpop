import { z } from "zod";

import { PaginationQuerySchema } from "./api";
import { CountryCodeSchema, HexColorSchema, IsoDateTimeSchema, ObjectIdSchema } from "./common";
import { CountryStatusSchema } from "./country";
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

export const PackagingFieldsSchema = z.object({
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
});

const minNotOverMax = {
  check: (p: { minItems: number; maxItems: number }) => p.minItems <= p.maxItems,
  params: { message: "minItems must not exceed maxItems", path: ["minItems"] },
};

export const PackagingSchema = PackagingFieldsSchema.refine(
  minNotOverMax.check,
  minNotOverMax.params,
);
export type Packaging = z.infer<typeof PackagingSchema>;

export const ItemFieldsSchema = z.object({
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
});

const needsNameLimit = {
  check: (item: { personalizable: boolean; personalizationMaxLength?: number | undefined }) =>
    !item.personalizable || item.personalizationMaxLength !== undefined,
  params: {
    message: "personalizationMaxLength is required for personalizable items",
    path: ["personalizationMaxLength"],
  },
};

export const ItemSchema = ItemFieldsSchema.refine(needsNameLimit.check, needsNameLimit.params);
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

/** What `GET /catalog?country=xx` returns. A coming-soon country has empty lists. */
export const CatalogResponseSchema = CountryCatalogSchema.extend({
  status: CountryStatusSchema,
  categories: z.array(z.string()),
});
export type CatalogResponse = z.infer<typeof CatalogResponseSchema>;

/** Admin saves a whole item or packaging; ids come from the server on create. */
export const SaveItemRequestSchema = ItemFieldsSchema.omit({ id: true }).refine(
  needsNameLimit.check,
  needsNameLimit.params,
);
export type SaveItemRequest = z.infer<typeof SaveItemRequestSchema>;

export const SavePackagingRequestSchema = PackagingFieldsSchema.omit({ id: true }).refine(
  minNotOverMax.check,
  minNotOverMax.params,
);
export type SavePackagingRequest = z.infer<typeof SavePackagingRequestSchema>;

export const ItemListQuerySchema = PaginationQuerySchema.extend({
  search: z.string().trim().max(80).optional(),
  category: z.string().trim().max(40).optional(),
  active: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
});
export type ItemListQuery = z.infer<typeof ItemListQuerySchema>;

export const PriceEntrySchema = z.object({
  country: CountryCodeSchema,
  priceMinor: MinorUnitsSchema.nonnegative(),
  inStock: z.boolean(),
});
export type PriceEntry = z.infer<typeof PriceEntrySchema>;

/** Bulk upsert for one item or packaging across countries (one row per country). */
export const SetPricesRequestSchema = z.object({
  prices: z
    .array(PriceEntrySchema)
    .min(1)
    .max(250)
    .refine((rows) => new Set(rows.map((row) => row.country)).size === rows.length, {
      message: "Each country may appear once",
    }),
});
export type SetPricesRequest = z.infer<typeof SetPricesRequestSchema>;

export const PricesResponseSchema = z.object({ prices: z.array(PriceEntrySchema) });
export type PricesResponse = z.infer<typeof PricesResponseSchema>;

/** A stored asset: the image metadata plus where to find it again. */
export const AssetRecordSchema = AssetSchema.extend({
  id: ObjectIdSchema,
  createdAt: IsoDateTimeSchema,
});
export type AssetRecord = z.infer<typeof AssetRecordSchema>;

export const AssetUploadResponseSchema = z.object({ asset: AssetRecordSchema });
export type AssetUploadResponse = z.infer<typeof AssetUploadResponseSchema>;

export const UpdateAssetAnchorRequestSchema = z.object({ anchor: AssetSchema.shape.anchor });
export type UpdateAssetAnchorRequest = z.infer<typeof UpdateAssetAnchorRequestSchema>;

/** Largest upload accepted, and the longest side an image is kept at. */
export const ASSET_MAX_BYTES = 8 * 1024 * 1024;
export const ASSET_MAX_SIDE_PX = 1600;
export const ASSET_ACCEPTED_TYPES = ["image/png", "image/webp", "image/jpeg"] as const;
