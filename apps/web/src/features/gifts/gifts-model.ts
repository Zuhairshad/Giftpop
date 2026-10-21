import type { CountryCode, PublicTemplate, TemplateItemSummary } from "@giftpop/contracts";

import { giftsPath } from "@/features/home/view-models";

export type CategoryChip = { slug: string; name: string; count: number };

/**
 * The filter chips: the categories of the templates the API returned for this country, one chip
 * per slug (the first name seen wins), sorted by name. A template with no category adds none.
 */
export function categoryChips(templates: readonly PublicTemplate[]): CategoryChip[] {
  const bySlug = new Map<string, CategoryChip>();
  for (const { category } of templates) {
    if (category === null) continue;
    const seen = bySlug.get(category.slug);
    if (seen) seen.count += 1;
    else bySlug.set(category.slug, { slug: category.slug, name: category.name, count: 1 });
  }
  return [...bySlug.values()].sort(
    (a, b) => a.name.localeCompare(b.name, "en") || a.slug.localeCompare(b.slug, "en"),
  );
}

/** `?category=` as a slug: trimmed and lower-cased, or null when absent or blank. Repeats keep the first. */
export function categoryParam(raw: string | string[] | undefined): string | null {
  const first = Array.isArray(raw) ? raw[0] : raw;
  const slug = first?.trim().toLowerCase();
  return slug ? slug : null;
}

/** Keeps the API's order. A null slug keeps everything; an unknown slug keeps nothing. */
export function filterByCategory(
  templates: readonly PublicTemplate[],
  slug: string | null,
): PublicTemplate[] {
  if (slug === null) return [...templates];
  return templates.filter((template) => template.category?.slug === slug);
}

/** The shareable address of the page, optionally narrowed to one category. */
export function giftsHref(country: CountryCode, category?: string | null): string {
  const base = giftsPath(country);
  return category ? `${base}?category=${encodeURIComponent(category)}` : base;
}

/** "+3 more" under the item names, or null when every item is already named. */
export function moreItemsLabel(summary: TemplateItemSummary): string | null {
  return summary.moreCount > 0 ? `+${summary.moreCount} more` : null;
}

/** The link's accessible name begins with its visible text ("Order this gift"). */
export function orderLabel(title: string): string {
  return `Order this gift: ${title}`;
}

/**
 * Width of the scene as a percentage of a square well, so the scene fills it along its longer side
 * and keeps its own shape (a bouquet is wider than tall, a framed gift taller than wide).
 */
export function sceneWidthPercent(bounds: { width: number; height: number }): number {
  if (bounds.width <= 0 || bounds.height <= 0) return 100;
  return Math.min(100, (bounds.width / bounds.height) * 100);
}

/** "1 gift" or "12 gifts". */
export function giftCountLabel(count: number): string {
  return count === 1 ? "1 gift" : `${count} gifts`;
}
