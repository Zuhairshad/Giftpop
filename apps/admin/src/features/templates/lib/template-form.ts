import {
  CountryCodeSchema,
  CreateTemplateRequestSchema,
  TemplateCategorySchema,
  TemplateCategorySlugSchema,
  UpdateTemplateRequestSchema,
} from "@giftpop/contracts";
import type {
  CreateTemplateRequest,
  FeaturedTemplate,
  TemplateCategory,
  UpdateTemplateRequest,
} from "@giftpop/contracts";
import { z } from "zod";

import { extractShareId } from "./share-link";

const shape = CreateTemplateRequestSchema.shape;

/** The category as the form holds it: an empty slug means the typed name had nothing a slug can use. */
const CategoryFieldSchema = z
  .object({
    slug: z
      .string()
      .min(1, "Use at least one letter or number in the category name")
      .pipe(TemplateCategorySlugSchema),
    name: TemplateCategorySchema.shape.name,
  })
  .nullable();

/** What the dialog edits: the contract's fields, with the share link as typed and no defaults. */
export const TemplateFormSchema = z.object({
  shareLink: z.string(),
  title: shape.title,
  description: z.string().trim().max(300, "Keep the description to 300 characters"),
  countries: z.array(CountryCodeSchema).min(1, "Choose at least one country"),
  sortOrder: z.number("Enter a whole number").int("Enter a whole number"),
  active: z.boolean(),
  category: CategoryFieldSchema,
  featured: z.boolean(),
});
export type TemplateFormValues = z.infer<typeof TemplateFormSchema>;

/** Create needs a readable share link as well. */
export const CreateTemplateFormSchema = TemplateFormSchema.refine(
  (values) => extractShareId(values.shareLink) !== null,
  {
    path: ["shareLink"],
    message: "Paste a share link like https://…/g/abc123XYZ_ or the share id",
  },
);

export function emptyTemplateValues(): TemplateFormValues {
  return {
    shareLink: "",
    title: "",
    description: "",
    countries: [],
    sortOrder: 0,
    active: true,
    category: null,
    featured: false,
  };
}

export function templateToValues(template: FeaturedTemplate): TemplateFormValues {
  return {
    shareLink: template.shareId,
    title: template.title,
    description: template.description,
    countries: template.countries,
    sortOrder: template.sortOrder,
    active: template.active,
    category: template.category,
    featured: template.featured,
  };
}

/** The create body, parsed with the contract. Throws when the share link is unreadable. */
export function toCreateRequest(values: TemplateFormValues): CreateTemplateRequest {
  return CreateTemplateRequestSchema.parse({
    title: values.title,
    description: values.description,
    shareId: extractShareId(values.shareLink),
    countries: values.countries,
    sortOrder: values.sortOrder,
    category: values.category,
    featured: values.featured,
  });
}

export function toUpdateRequest(values: TemplateFormValues): UpdateTemplateRequest {
  return UpdateTemplateRequestSchema.parse({
    title: values.title,
    description: values.description,
    countries: values.countries,
    sortOrder: values.sortOrder,
    active: values.active,
    category: values.category,
    featured: values.featured,
  });
}

/** Only the sort order, for the move buttons. Hand-built for the same reason as `toActiveRequest`. */
export function toSortOrderRequest(sortOrder: number): UpdateTemplateRequest {
  return { sortOrder };
}

/** Only the category, for changing it from the list. Null clears it. */
export function toCategoryRequest(category: TemplateCategory | null): UpdateTemplateRequest {
  return { category };
}

/**
 * Only the active flag, for the switch in the list. Built by hand, not parsed: the contract's
 * defaults (`description`, `sortOrder`, and `category`/`featured`) would otherwise be added and overwrite the saved values.
 */
export function toActiveRequest(active: boolean): UpdateTemplateRequest {
  return { active };
}
