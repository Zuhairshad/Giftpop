import { CountrySchema, FeaturedTemplateSchema, SharedDesignViewSchema } from "@giftpop/contracts";
import type {
  Country,
  CreateTemplateRequest,
  FeaturedTemplate,
  SharedDesignView,
  UpdateTemplateRequest,
} from "@giftpop/contracts";
import { z } from "zod";

import { apiFetch } from "@/lib/api";

/** Browser-side calls for the featured templates screen. */

export function listTemplates(signal?: AbortSignal): Promise<FeaturedTemplate[]> {
  return apiFetch("/templates/admin", z.array(FeaturedTemplateSchema), {
    ...(signal ? { signal } : {}),
  });
}

export function createTemplate(body: CreateTemplateRequest): Promise<FeaturedTemplate> {
  return apiFetch("/templates/admin", FeaturedTemplateSchema, { method: "POST", body });
}

export function updateTemplate(id: string, body: UpdateTemplateRequest): Promise<FeaturedTemplate> {
  return apiFetch(`/templates/admin/${id}`, FeaturedTemplateSchema, { method: "PATCH", body });
}

export async function deleteTemplate(id: string): Promise<void> {
  await apiFetch(`/templates/admin/${id}`, z.undefined(), { method: "DELETE" });
}

export function listCountries(signal?: AbortSignal): Promise<Country[]> {
  return apiFetch("/countries/admin", z.array(CountrySchema), {
    ...(signal ? { signal } : {}),
  });
}

/** The public share view, for the packaging and item documents behind a template's design. */
export function loadSharedDesign(shareId: string, signal?: AbortSignal): Promise<SharedDesignView> {
  return apiFetch(`/designs/${encodeURIComponent(shareId)}`, SharedDesignViewSchema, {
    ...(signal ? { signal } : {}),
  });
}
