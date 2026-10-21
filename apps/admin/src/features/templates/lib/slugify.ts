const MAX_SLUG_LENGTH = 40;

/**
 * Turns a category name into a slug that satisfies `TemplateCategorySlugSchema`:
 * "Get well" becomes "get-well", "Thank you!" becomes "thank-you". Accents are folded
 * ("Fête" becomes "fete"). Returns an empty string when the name has no letters or digits
 * a slug can use, so callers can ask for a different name.
 */
export function slugify(name: string): string {
  const folded = name.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const hyphenated = folded.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  // Cut at the limit, then drop a hyphen the cut may have left at the end.
  return hyphenated.slice(0, MAX_SLUG_LENGTH).replace(/-+$/, "");
}
