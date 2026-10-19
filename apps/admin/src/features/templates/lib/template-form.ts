import {
  CountryCodeSchema,
  CreateTemplateRequestSchema,
  UpdateTemplateRequestSchema,
} from "@giftpop/contracts";
import type {
  CreateTemplateRequest,
  FeaturedTemplate,
  UpdateTemplateRequest,
} from "@giftpop/contracts";
import { z } from "zod";

import { extractShareId } from "./share-link";

const shape = CreateTemplateRequestSchema.shape;

/** What the dialog edits: the contract's fields, with the share link as typed and no defaults. */
export const TemplateFormSchema = z.object({
  shareLink: z.string(),
  title: shape.title,
  description: z.string().trim().max(300, "Keep the description to 300 characters"),
  countries: z.array(CountryCodeSchema).min(1, "Choose at least one country"),
  sortOrder: z.number("Enter a whole number").int("Enter a whole number"),
  active: z.boolean(),
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
  return { shareLink: "", title: "", description: "", countries: [], sortOrder: 0, active: true };
}

export function templateToValues(template: FeaturedTemplate): TemplateFormValues {
  return {
    shareLink: template.shareId,
    title: template.title,
    description: template.description,
    countries: template.countries,
    sortOrder: template.sortOrder,
    active: template.active,
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
  });
}

export function toUpdateRequest(values: TemplateFormValues): UpdateTemplateRequest {
  return UpdateTemplateRequestSchema.parse({
    title: values.title,
    description: values.description,
    countries: values.countries,
    sortOrder: values.sortOrder,
    active: values.active,
  });
}

/**
 * Only the active flag, for the switch in the list. Built by hand, not parsed: the contract's
 * defaults (`description`, `sortOrder`) would otherwise be added and overwrite the saved values.
 */
export function toActiveRequest(active: boolean): UpdateTemplateRequest {
  return { active };
}
