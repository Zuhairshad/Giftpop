import {
  DesignSchema,
  SHARE_ID_LENGTH,
  type CountryCode,
  type Design,
  type SavedDesign,
  type SharedDesignView,
} from "@giftpop/contracts";
import { nanoid } from "nanoid";

import { AppError, isDuplicateKeyError } from "../../lib/errors";
import { toItem, toPackaging } from "../catalog/mappers";
import { ItemModel, PackagingModel, type ItemDoc, type PackagingDoc } from "../catalog/model";
import { getCountryCatalog } from "../catalog/public.service";
import { loadValidatedDesign } from "../quotes/service";
import { TemplateModel, type TemplateDoc } from "../templates/model";

import { DesignModel, type DesignDoc } from "./model";

const MAX_SHARE_ID_ATTEMPTS = 5;

/** A copy of the design without the customer's private request, for share links and templates. */
export function withoutCustomRequest(design: Design): Design {
  return { ...design, personalisation: { ...design.personalisation, customRequest: "" } };
}

/** A stored design that no longer parses is a server-side data fault, never the caller's mistake. */
export function parseStoredDesign(stored: unknown): Design {
  const result = DesignSchema.safeParse(stored);
  if (!result.success) {
    throw new AppError("INTERNAL", 500, "This gift could not be loaded", undefined);
  }
  return result.data;
}

function toSavedDesign(doc: DesignDoc): SavedDesign {
  return {
    id: doc._id.toHexString(),
    shareId: doc.shareId,
    country: doc.country,
    design: parseStoredDesign(doc.design),
    createdAt: doc.createdAt.toISOString(),
  };
}

/**
 * A template seen as a saved design, for a share id that has no saved design of its own. Null when
 * there is no country to look it up in (not viewed from one, and sold in none).
 */
function templateAsSavedDesign(
  template: TemplateDoc,
  viewingCountry?: CountryCode,
): SavedDesign | null {
  const country = viewingCountry ?? template.countries[0];
  if (!country) return null;
  return {
    id: template._id.toHexString(),
    shareId: template.shareId,
    country,
    design: parseStoredDesign(template.design),
    createdAt: template.createdAt.toISOString(),
  };
}

/** Validates the design for the country, then stores it under a fresh share id. */
export async function saveDesign(country: CountryCode, design: Design): Promise<SavedDesign> {
  await loadValidatedDesign(country, design);

  for (let attempt = 1; attempt <= MAX_SHARE_ID_ATTEMPTS; attempt += 1) {
    try {
      const created = await DesignModel.create({
        shareId: nanoid(SHARE_ID_LENGTH),
        country,
        design,
        createdAt: new Date(),
      });
      return toSavedDesign(created.toObject());
    } catch (error) {
      // Only `shareId` is unique, so a duplicate key means the id was taken: draw another.
      if (!isDuplicateKeyError(error) || attempt === MAX_SHARE_ID_ATTEMPTS) throw error;
    }
  }
  throw new AppError("INTERNAL", 500, "Could not create a share id");
}

/** The active ready-made gift that uses this share id, if any. */
function findReadyMade(shareId: string): Promise<TemplateDoc | null> {
  return TemplateModel.findOne({ shareId, active: true }).lean<TemplateDoc>();
}

/**
 * What the share page draws. Never fails because the catalog moved on: items
 * that are no longer sold in the country keep their documents in `items` (when
 * they still exist) and are all listed in `unavailableItemIds`. Availability is for
 * `viewingCountry` when given (a template opened from another country), else for the
 * country the gift was saved in.
 *
 * A ready-made gift opens from the design saved under its share id; when there is none (the
 * seeded gifts never had one, and a template keeps its own copy of the design so it survives its
 * saved design) it opens from the template itself. `readyMade` is set whenever an active template
 * uses the share id.
 */
export async function getSharedDesign(
  shareId: string,
  viewingCountry?: CountryCode,
): Promise<SharedDesignView> {
  const [doc, template] = await Promise.all([
    DesignModel.findOne({ shareId }).lean<DesignDoc>(),
    findReadyMade(shareId),
  ]);
  const saved = doc
    ? toSavedDesign(doc)
    : template
      ? templateAsSavedDesign(template, viewingCountry)
      : null;
  if (!saved) throw new AppError("NOT_FOUND", 404, "No gift with that link");
  const { design } = saved;

  const itemIds = design.items.map((line) => line.itemId);
  const [catalog, itemDocs, packagingDoc] = await Promise.all([
    getCountryCatalog(viewingCountry ?? saved.country),
    ItemModel.find({ _id: { $in: itemIds } }).lean<ItemDoc[]>(),
    PackagingModel.findById(design.packagingId).lean<PackagingDoc>(),
  ]);
  if (!packagingDoc) throw new AppError("NOT_FOUND", 404, "This gift's format was removed");

  const sellable = new Set(catalog.items.map(({ item }) => item.id));
  const byId = new Map(itemDocs.map((d) => [d._id.toHexString(), toItem(d)]));
  return {
    shareId: saved.shareId,
    country: catalog.country,
    currency: catalog.currency,
    design: withoutCustomRequest(design),
    packaging: toPackaging(packagingDoc),
    packagingAvailable: catalog.packagings.some((p) => p.packaging.id === design.packagingId),
    // Design line order, so the response is stable.
    items: itemIds.flatMap((id) => {
      const item = byId.get(id);
      return item ? [item] : [];
    }),
    unavailableItemIds: itemIds.filter((id) => !sellable.has(id)),
    readyMade: template ? { title: template.title, description: template.description } : null,
    createdAt: saved.createdAt,
  };
}
