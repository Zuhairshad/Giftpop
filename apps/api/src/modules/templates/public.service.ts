import {
  type CountryCode,
  type Design,
  type PublicTemplate,
  type TemplateCategorySlug,
  type TemplateItemSummary,
} from "@giftpop/contracts";

import { getCountryCatalog } from "../catalog/public.service";
import { CountryModel, type CountryDoc } from "../countries/model";
import { parseStoredDesign } from "../designs/service";
import { priceDesign } from "../quotes/service";

import { TemplateModel, type TemplateDoc } from "./model";
import { isSellable } from "./service";

const SUMMARY_NAMES = 4;

/** Each item once, in design order: the first 4 names, then how many more there are. */
function summariseItems(design: Design, nameById: Map<string, string>): TemplateItemSummary {
  const names: string[] = [];
  for (const line of design.items) {
    const name = nameById.get(line.itemId);
    if (name !== undefined && !names.includes(name)) names.push(name);
  }
  return {
    names: names.slice(0, SUMMARY_NAMES),
    moreCount: Math.max(0, names.length - SUMMARY_NAMES),
  };
}

/** Featured first, then `sortOrder`, then title. Done here because old documents have no `featured`. */
function byShelfOrder(a: TemplateDoc, b: TemplateDoc): number {
  return (
    Number(b.featured ?? false) - Number(a.featured ?? false) ||
    a.sortOrder - b.sortOrder ||
    (a.title < b.title ? -1 : a.title > b.title ? 1 : 0)
  );
}

/**
 * Active templates for one live country that can still be made there today, each with its
 * price for the country's first payment mode. Prices come from the catalog only. A template
 * that cannot be priced is left out; it never fails the list.
 */
export async function listPublicTemplates(
  country: CountryCode,
  category?: TemplateCategorySlug,
): Promise<PublicTemplate[]> {
  const catalog = await getCountryCatalog(country);
  if (catalog.status !== "live") return [];
  const countryDoc = await CountryModel.findOne({ code: country }).lean<CountryDoc>();
  if (!countryDoc) return [];

  const docs = await TemplateModel.find({
    active: true,
    countries: country,
    ...(category ? { "category.slug": category } : {}),
  }).lean<TemplateDoc[]>();
  docs.sort(byShelfOrder);

  const nameById = new Map(catalog.items.map((i) => [i.item.id, i.item.name]));
  const result: PublicTemplate[] = [];
  for (const doc of docs) {
    // One template that no longer parses or prices must not take the whole list down.
    let design: Design;
    try {
      design = parseStoredDesign(doc.design);
    } catch {
      continue;
    }
    if (!isSellable(catalog, design)) continue;
    const packaging = catalog.packagings.find((p) => p.packaging.id === design.packagingId);
    if (!packaging) continue;

    let priceMinor: number;
    try {
      const [first] = priceDesign({ country: countryDoc, catalog }, design).quotes;
      if (!first) continue;
      priceMinor = first.totalMinor;
    } catch {
      continue;
    }

    const items = new Map(
      design.items.flatMap((line) => {
        const found = catalog.items.find((i) => i.item.id === line.itemId);
        return found ? [[found.item.id, found.item] as const] : [];
      }),
    );
    result.push({
      id: doc._id.toHexString(),
      title: doc.title,
      description: doc.description,
      shareId: doc.shareId,
      country: catalog.country,
      currency: catalog.currency,
      design,
      packaging: packaging.packaging,
      items: [...items.values()],
      category: doc.category ?? null,
      featured: doc.featured ?? false,
      priceMinor,
      itemSummary: summariseItems(design, nameById),
    });
  }
  return result;
}
