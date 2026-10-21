import type {
  CountryCode,
  CurrencyCode,
  Design,
  Item,
  Packaging,
  PublicTemplate,
} from "@giftpop/contracts";

import { builderHref } from "@/features/builder/state";

export function countryPath(country: CountryCode): string {
  return `/${country.toLowerCase()}`;
}

/** The ready-made gifts catalog for a country, for example `/pk/gifts`. */
export function giftsPath(country: CountryCode): string {
  return `${countryPath(country)}/gifts`;
}

/**
 * The catalog link that goes with a builder link (`/pk/build` gives `/pk/gifts`), or null when the
 * builder link is not a country's own (`/countries`, shown before a country is chosen).
 */
export function giftsHrefFromBuild(buildHref: string): string | null {
  const match = /^(\/[a-z]{2})\/build$/.exec(buildHref);
  return match ? `${match[1]}/gifts` : null;
}

export type TemplateCardModel = {
  id: string;
  title: string;
  description: string;
  href: string;
  design: Design;
  packaging: Packaging;
  items: Item[];
  /** The API's total for the country's first payment mode, in minor units. Display only: never sent back. */
  priceMinor: number;
  currency: CurrencyCode;
};

/** Templates for other countries are dropped. The price is the API's `priceMinor`, carried through unchanged. */
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
      // The builder loads the design from `?from=<shareId>`.
      href: builderHref(country, template.shareId),
      design: template.design,
      packaging: template.packaging,
      items: template.items,
      priceMinor: template.priceMinor,
      currency: template.currency,
    }));
}
