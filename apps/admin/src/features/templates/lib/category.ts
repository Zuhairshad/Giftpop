import type { FeaturedTemplate, TemplateCategory } from "@giftpop/contracts";

import { slugify } from "./slugify";

/** Offered in helper text only. They gate nothing: any name staff type becomes a category. */
export const EXAMPLE_CATEGORY_NAMES = [
  "Birthday",
  "Anniversary",
  "Graduation",
  "Thank you",
  "Get well",
] as const;

const MAX_NAME_LENGTH = 40;

/** The categories already used by templates, one per slug, sorted by name. The first name seen for a slug wins. */
export function categoryOptions(
  templates: readonly Pick<FeaturedTemplate, "category">[],
  extra: TemplateCategory | null = null,
): TemplateCategory[] {
  const bySlug = new Map<string, TemplateCategory>();
  const all = [...templates.map((template) => template.category), extra];
  for (const category of all) {
    if (category && !bySlug.has(category.slug)) bySlug.set(category.slug, category);
  }
  return [...bySlug.values()].sort((a, b) => a.name.localeCompare(b.name, "en"));
}

export type NewCategoryResult =
  | { state: "empty" }
  | { state: "invalid"; reason: string }
  | { state: "ready"; category: TemplateCategory; reused: boolean };

/**
 * Reads the name staff typed for a new category. When its slug matches an existing category the
 * existing one is used, so one slug never carries two spellings of its name.
 */
export function resolveNewCategory(
  typed: string,
  existing: readonly TemplateCategory[],
): NewCategoryResult {
  const name = typed.trim().replace(/\s+/g, " ");
  if (name === "") return { state: "empty" };
  if (name.length > MAX_NAME_LENGTH) {
    return { state: "invalid", reason: `Keep the name to ${MAX_NAME_LENGTH} characters` };
  }
  const slug = slugify(name);
  if (slug === "") {
    return { state: "invalid", reason: "Use at least one letter or number in the name" };
  }
  const match = existing.find((category) => category.slug === slug);
  if (match) return { state: "ready", category: match, reused: true };
  return { state: "ready", category: { slug, name }, reused: false };
}
