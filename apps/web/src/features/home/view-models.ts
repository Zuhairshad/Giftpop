import type {
  CatalogResponse,
  CountryCode,
  Design,
  Item,
  Packaging,
  PublicTemplate,
} from "@giftpop/contracts";

import { formatMoney } from "@/lib/format-money";

/** Prices use a fixed locale so server and browser text match (see docs/decisions.md). */
const PRICE_LOCALE = "en";

export function countryPath(country: CountryCode): string {
  return `/${country.toLowerCase()}`;
}

/** The review step loads a design from `?from=<shareId>`. */
export function startFromHref(country: CountryCode, shareId: string): string {
  return `${countryPath(country)}/build/review?from=${encodeURIComponent(shareId)}`;
}

export function formatStepHref(country: CountryCode): string {
  return `${countryPath(country)}/build/format`;
}

/** "Pick 6 to 10", or "Pick 6" when the range is one number. */
export function pickRangeCopy(minItems: number, maxItems: number): string {
  return minItems === maxItems ? `Pick ${minItems}` : `Pick ${minItems} to ${maxItems}`;
}

export type TemplateCardModel = {
  id: string;
  title: string;
  description: string;
  href: string;
  design: Design;
  packaging: Packaging;
  items: Item[];
};

/** Templates for other countries are dropped; the price is deliberately absent (it comes from a quote). */
export function templateCards(
  templates: PublicTemplate[],
  country: CountryCode,
): TemplateCardModel[] {
  return templates
    .filter((template) => template.country === country)
    .map((template) => ({
      id: template.id,
      title: template.title,
      description: template.description,
      href: startFromHref(country, template.shareId),
      design: template.design,
      packaging: template.packaging,
      items: template.items,
    }));
}

export type FormatCardModel = {
  id: string;
  name: string;
  description: string;
  pickCopy: string;
  priceCopy: string;
  href: string;
  wrapperColor: string;
  ribbonColor: string;
};

/** Active, in-stock packagings only, in sort order. The price comes from the catalog. */
export function formatCards(catalog: CatalogResponse, country: CountryCode): FormatCardModel[] {
  return catalog.packagings
    .filter((entry) => entry.packaging.active && entry.inStock)
    .sort((a, b) => a.packaging.sortOrder - b.packaging.sortOrder)
    .map(({ packaging, priceMinor }) => ({
      id: packaging.id,
      name: packaging.name,
      description: packaging.description,
      pickCopy: pickRangeCopy(packaging.minItems, packaging.maxItems),
      priceCopy: `Format from ${formatMoney(priceMinor, catalog.currency, PRICE_LOCALE)}`,
      href: formatStepHref(country),
      wrapperColor: packaging.wrapperColors[0]?.hex ?? "#ffd3e0",
      ribbonColor: packaging.ribbonColors[0]?.hex ?? "#e8336d",
    }));
}

export type HomeSectionFlags = {
  chooseCountry: boolean;
  templates: boolean;
  formats: boolean;
};

/**
 * Which country-dependent sections render. `null` means the API call failed or timed out;
 * an empty list means nothing to show. Both hide the section silently. How it works and
 * the partnership band always render.
 */
export function sectionVisibility(input: {
  country: CountryCode | undefined;
  templates: TemplateCardModel[] | null;
  formats: FormatCardModel[] | null;
}): HomeSectionFlags {
  const hasCountry = input.country !== undefined;
  return {
    chooseCountry: !hasCountry,
    templates: hasCountry && (input.templates?.length ?? 0) > 0,
    formats: hasCountry && (input.formats?.length ?? 0) > 0,
  };
}
