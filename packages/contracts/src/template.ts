import { z } from "zod";

import { ItemSchema, PackagingSchema } from "./catalog";
import { CountryCodeSchema, IsoDateTimeSchema, ObjectIdSchema } from "./common";
import { DesignSchema, ShareIdSchema } from "./design";
import { CurrencyCodeSchema } from "./money";

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
  createdAt: IsoDateTimeSchema,
});
export type FeaturedTemplate = z.infer<typeof FeaturedTemplateSchema>;

export const CreateTemplateRequestSchema = z.object({
  title: z.string().trim().min(1).max(80),
  description: z.string().trim().max(300).default(""),
  shareId: ShareIdSchema,
  countries: z.array(CountryCodeSchema).min(1),
  sortOrder: z.number().int().default(0),
});
export type CreateTemplateRequest = z.infer<typeof CreateTemplateRequestSchema>;

export const UpdateTemplateRequestSchema = CreateTemplateRequestSchema.omit({ shareId: true })
  .extend({ active: z.boolean() })
  .partial();
export type UpdateTemplateRequest = z.infer<typeof UpdateTemplateRequestSchema>;

/** What the home page needs to draw and link one featured template for a country. */
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
});
export type PublicTemplate = z.infer<typeof PublicTemplateSchema>;

/** `POST /templates/:id/start`: a fresh copy of the design for the builder to load. */
export const TemplateStartResponseSchema = z.object({
  country: CountryCodeSchema,
  design: DesignSchema,
});
export type TemplateStartResponse = z.infer<typeof TemplateStartResponseSchema>;
