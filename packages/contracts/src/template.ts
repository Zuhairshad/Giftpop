import { z } from "zod";

import { CountryCodeSchema, IsoDateTimeSchema, ObjectIdSchema } from "./common";
import { DesignSchema, ShareIdSchema } from "./design";

/** A saved design that staff feature on the home page for chosen countries. */
export const FeaturedTemplateSchema = z.object({
  id: ObjectIdSchema,
  title: z.string().trim().min(1).max(80),
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
  shareId: ShareIdSchema,
  countries: z.array(CountryCodeSchema).min(1),
  sortOrder: z.number().int().default(0),
});
export type CreateTemplateRequest = z.infer<typeof CreateTemplateRequestSchema>;

export const UpdateTemplateRequestSchema = CreateTemplateRequestSchema.omit({ shareId: true })
  .extend({ active: z.boolean() })
  .partial();
export type UpdateTemplateRequest = z.infer<typeof UpdateTemplateRequestSchema>;
