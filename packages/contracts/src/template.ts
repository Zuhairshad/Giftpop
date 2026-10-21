import { z } from "zod";

import { ItemSchema, PackagingSchema } from "./catalog";
import { CountryCodeSchema, CountryParamSchema, IsoDateTimeSchema, ObjectIdSchema } from "./common";
import { DesignSchema, ShareIdSchema } from "./design";
import { CurrencyCodeSchema, MinorUnitsSchema } from "./money";

/** Lower-case words joined by hyphens, for example `get-well`. Also the `?category=` filter on the public list. */
export const TemplateCategorySlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(40)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export type TemplateCategorySlug = z.infer<typeof TemplateCategorySlugSchema>;

/**
 * An occasion such as birthday or get well. Categories are data (CLAUDE.md rule 7): staff type the name
 * on each template, and the shop builds its filter chips from the categories of live templates.
 */
export const TemplateCategorySchema = z.object({
  slug: TemplateCategorySlugSchema,
  name: z.string().trim().min(1).max(40),
});
export type TemplateCategory = z.infer<typeof TemplateCategorySchema>;

/** A saved design that staff feature on the home page for chosen countries. */
export const FeaturedTemplateSchema = z.object({
  id: ObjectIdSchema,
  title: z.string().trim().min(1).max(80),
  description: z.string().trim().max(300).default(""),
  shareId: ShareIdSchema,
  design: DesignSchema,
  countries: z.array(CountryCodeSchema).min(1),
  active: z.boolean(),
  sortOrder: z.number().int(),
  /** Null for a template that has no occasion. */
  category: TemplateCategorySchema.nullable().default(null),
  /** Staff pick: shown first on the ready-made gifts page. */
  featured: z.boolean().default(false),
  createdAt: IsoDateTimeSchema,
});
export type FeaturedTemplate = z.infer<typeof FeaturedTemplateSchema>;

export const CreateTemplateRequestSchema = z.object({
  title: z.string().trim().min(1).max(80),
  description: z.string().trim().max(300).default(""),
  shareId: ShareIdSchema,
  countries: z.array(CountryCodeSchema).min(1),
  sortOrder: z.number().int().default(0),
  category: TemplateCategorySchema.nullable().default(null),
  featured: z.boolean().default(false),
});
export type CreateTemplateRequest = z.infer<typeof CreateTemplateRequestSchema>;

export const UpdateTemplateRequestSchema = CreateTemplateRequestSchema.omit({ shareId: true })
  .extend({ active: z.boolean() })
  .partial()
  // `.partial()` keeps the inner defaults, so these are redeclared without them: leaving a field out
  // of an update must change nothing (a one-field PATCH used to reset description and sortOrder).
  .extend({
    description: CreateTemplateRequestSchema.shape.description.unwrap().optional(),
    sortOrder: z.number().int().optional(),
    category: TemplateCategorySchema.nullable().optional(),
    featured: z.boolean().optional(),
  });
export type UpdateTemplateRequest = z.infer<typeof UpdateTemplateRequestSchema>;

/** The names shown under "What is inside": up to 4, then how many more there are. */
export const TemplateItemSummarySchema = z.object({
  names: z.array(z.string()).max(4),
  moreCount: z.number().int().nonnegative(),
});
export type TemplateItemSummary = z.infer<typeof TemplateItemSummarySchema>;

/** `GET /templates?country=&category=`. The category is optional and narrows the list. */
export const TemplateListQuerySchema = z.object({
  country: CountryParamSchema,
  category: TemplateCategorySlugSchema.optional(),
});

/** What the ready-made gifts page and the builder strip need to draw, price and link one template for a country. */
export const PublicTemplateSchema = z.object({
  id: ObjectIdSchema,
  title: z.string(),
  description: z.string(),
  shareId: ShareIdSchema,
  country: CountryCodeSchema,
  currency: CurrencyCodeSchema,
  design: DesignSchema,
  packaging: PackagingSchema,
  items: z.array(ItemSchema),
  category: TemplateCategorySchema.nullable(),
  featured: z.boolean(),
  /**
   * Total for the country's first payment mode, from catalog prices only, so the customer sees it
   * before choosing how to pay. Computed by the API with `computeQuote`; the browser never sends it.
   */
  priceMinor: MinorUnitsSchema.nonnegative(),
  itemSummary: TemplateItemSummarySchema,
});
export type PublicTemplate = z.infer<typeof PublicTemplateSchema>;

/** `POST /templates/:id/start`. Without a country the API picks the first listed live country that can make the gift. */
export const TemplateStartRequestSchema = z.object({ country: CountryCodeSchema.optional() });
export type TemplateStartRequest = z.infer<typeof TemplateStartRequestSchema>;

/** `POST /templates/:id/start`: a fresh copy of the design for the builder to load. */
export const TemplateStartResponseSchema = z.object({
  country: CountryCodeSchema,
  design: DesignSchema,
});
export type TemplateStartResponse = z.infer<typeof TemplateStartResponseSchema>;
