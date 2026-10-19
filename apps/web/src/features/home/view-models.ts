import type { CountryCode, Design, Item, Packaging, PublicTemplate } from "@giftpop/contracts";

import { builderHref } from "@/features/builder/state";

export function countryPath(country: CountryCode): string {
  return `/${country.toLowerCase()}`;
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
      // The builder loads the design from `?from=<shareId>`.
      href: builderHref(country, template.shareId),
      design: template.design,
      packaging: template.packaging,
      items: template.items,
    }));
}
