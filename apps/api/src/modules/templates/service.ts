import {
  validateDesign,
  type CatalogResponse,
  type CountryCode,
  type CreateTemplateRequest,
  type Design,
  type FeaturedTemplate,
  type PublicTemplate,
  type TemplateStartResponse,
  type UpdateTemplateRequest,
} from "@giftpop/contracts";

import { AppError } from "../../lib/errors";
import { getCountryCatalog } from "../catalog/public.service";
import { CountryModel, type CountryDoc } from "../countries/model";
import { DesignModel, type DesignDoc } from "../designs/model";
import { parseStoredDesign, withoutCustomRequest } from "../designs/service";

import { TemplateModel, type TemplateDoc } from "./model";

function toFeatured(doc: TemplateDoc): FeaturedTemplate {
  return {
    id: doc._id.toHexString(),
    title: doc.title,
    description: doc.description,
    shareId: doc.shareId,
    design: parseStoredDesign(doc.design),
    countries: doc.countries,
    active: doc.active,
    sortOrder: doc.sortOrder,
    category: doc.category ?? null,
    featured: doc.featured ?? false,
    createdAt: doc.createdAt.toISOString(),
  };
}

function isSellable(catalog: CatalogResponse, design: Design): boolean {
  return catalog.status === "live" && validateDesign(design, catalog).length === 0;
}

/**
 * Every listed country must exist and be live (422 otherwise), and the design must be
 * sellable in each: 422 DESIGN_INVALID with `details.failures`, one `{ country, problems }`
 * per failing country (the first one is repeated at the top of `details`).
 */
async function assertSellableIn(countries: CountryCode[], design: Design): Promise<void> {
  const unique = [...new Set(countries)];
  const docs = await CountryModel.find({ code: { $in: unique } }).lean<CountryDoc[]>();
  const known = new Map(docs.map((c) => [c.code, c]));
  const missing = unique.filter((code) => !known.has(code));
  if (missing.length > 0) {
    throw new AppError("VALIDATION_ERROR", 422, `Unknown country: ${missing.join(", ")}`, {
      countries: missing,
    });
  }
  const notLive = unique.filter((code) => known.get(code)?.status !== "live");
  if (notLive.length > 0) {
    throw new AppError("VALIDATION_ERROR", 422, `Not live yet: ${notLive.join(", ")}`, {
      countries: notLive,
    });
  }

  const failures: { country: CountryCode; problems: ReturnType<typeof validateDesign> }[] = [];
  for (const country of unique) {
    const problems = validateDesign(design, await getCountryCatalog(country));
    if (problems.length > 0) failures.push({ country, problems });
  }
  const [first] = failures;
  if (first) {
    throw new AppError(
      "DESIGN_INVALID",
      422,
      "This design cannot be made in every listed country",
      {
        ...first,
        failures,
      },
    );
  }
}

export async function listTemplates(): Promise<FeaturedTemplate[]> {
  const docs = await TemplateModel.find().sort({ createdAt: -1, _id: -1 }).lean<TemplateDoc[]>();
  return docs.map(toFeatured);
}

export async function createTemplate(input: CreateTemplateRequest): Promise<FeaturedTemplate> {
  const saved = await DesignModel.findOne({ shareId: input.shareId }).lean<DesignDoc>();
  if (!saved) throw new AppError("NOT_FOUND", 404, "No saved gift with that share id");
  const design = withoutCustomRequest(parseStoredDesign(saved.design));
  await assertSellableIn(input.countries, design);

  const created = await TemplateModel.create({
    title: input.title,
    description: input.description,
    shareId: input.shareId,
    design,
    countries: [...new Set(input.countries)],
    active: true,
    sortOrder: input.sortOrder,
    category: input.category,
    featured: input.featured,
    createdAt: new Date(),
  });
  return toFeatured(created.toObject());
}

export async function updateTemplate(
  id: string,
  input: UpdateTemplateRequest,
): Promise<FeaturedTemplate> {
  const doc = await TemplateModel.findById(id).lean<TemplateDoc>();
  if (!doc) throw new AppError("NOT_FOUND", 404, "No template with that id");

  const set: Partial<TemplateDoc> = {};
  if (input.title !== undefined) set.title = input.title;
  if (input.description !== undefined) set.description = input.description;
  if (input.sortOrder !== undefined) set.sortOrder = input.sortOrder;
  if (input.active !== undefined) set.active = input.active;
  if (input.category !== undefined) set.category = input.category;
  if (input.featured !== undefined) set.featured = input.featured;
  if (input.countries !== undefined) {
    await assertSellableIn(input.countries, parseStoredDesign(doc.design));
    set.countries = [...new Set(input.countries)];
  }
  const updated = await TemplateModel.findByIdAndUpdate(
    id,
    { $set: set },
    { returnDocument: "after" },
  ).lean<TemplateDoc>();
  if (!updated) throw new AppError("NOT_FOUND", 404, "No template with that id");
  return toFeatured(updated);
}

export async function deleteTemplate(id: string): Promise<void> {
  const result = await TemplateModel.deleteOne({ _id: id });
  if (result.deletedCount === 0) throw new AppError("NOT_FOUND", 404, "No template with that id");
}

/** Active templates for one live country that can still be made there today. */
export async function listPublicTemplates(country: CountryCode): Promise<PublicTemplate[]> {
  const catalog = await getCountryCatalog(country);
  if (catalog.status !== "live") return [];

  const docs = await TemplateModel.find({ active: true, countries: country })
    .sort({ sortOrder: 1, title: 1 })
    .lean<TemplateDoc[]>();

  const result: PublicTemplate[] = [];
  for (const doc of docs) {
    // One template that no longer parses must not take the whole list down.
    let design: Design;
    try {
      design = parseStoredDesign(doc.design);
    } catch {
      continue;
    }
    if (!isSellable(catalog, design)) continue;
    const packaging = catalog.packagings.find((p) => p.packaging.id === design.packagingId);
    if (!packaging) continue;
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
      // Step A stub: the api-templates agent computes the real price and summary.
      priceMinor: 0,
      itemSummary: { names: [], moreCount: 0 },
    });
  }
  return result;
}

/**
 * A deep copy of the template's design for the builder. The country is the one asked
 * for, or the first listed country that is live. 404 unknown or inactive, 422 when the
 * template can no longer be made there.
 */
export async function startTemplate(
  id: string,
  requested: CountryCode | undefined,
): Promise<TemplateStartResponse> {
  const doc = await TemplateModel.findById(id).lean<TemplateDoc>();
  if (!doc?.active) throw new AppError("NOT_FOUND", 404, "No template with that id");

  const design = parseStoredDesign(doc.design);
  if (requested) {
    if (!doc.countries.includes(requested)) {
      throw new AppError("VALIDATION_ERROR", 422, "This template is not offered in that country");
    }
    if (!isSellable(await getCountryCatalog(requested), design)) {
      throw new AppError(
        "VALIDATION_ERROR",
        422,
        "This gift is no longer available in that country",
      );
    }
    return { country: requested, design: structuredClone(design) };
  }

  // No country asked for: the first listed country that is live AND can still make this gift.
  const live = await CountryModel.find({ code: { $in: doc.countries }, status: "live" })
    .select({ code: 1 })
    .lean<Pick<CountryDoc, "code">[]>();
  const liveCodes = new Set(live.map((c) => c.code));
  for (const code of doc.countries.filter((c) => liveCodes.has(c))) {
    if (isSellable(await getCountryCatalog(code), design)) {
      return { country: code, design: structuredClone(design) };
    }
  }
  throw new AppError("VALIDATION_ERROR", 422, "This gift is not available anywhere right now");
}
