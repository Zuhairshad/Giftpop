import type {
  Item,
  ItemListQuery,
  Paginated,
  PricesResponse,
  SaveItemRequest,
  SetPricesRequest,
} from "@giftpop/contracts";
import type { QueryFilter } from "mongoose";
import { Types } from "mongoose";

import { AppError } from "../../lib/errors";

import { toItem, toItemDoc } from "./mappers";
import { CATALOG_SORT, ItemModel, type ItemDoc } from "./model";
import { listPrices, setPrices } from "./prices.service";

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function notFound(id: string): AppError {
  return new AppError("NOT_FOUND", 404, `No item with id ${id}`);
}

/** Creates the item or replaces it, keyed by `id`. Idempotent. */
export async function upsertItem(item: Item): Promise<Item> {
  const doc = await ItemModel.findOneAndReplace({ _id: item.id }, toItemDoc(item), {
    upsert: true,
    returnDocument: "after",
  }).lean<ItemDoc>();
  return toItem(doc);
}

export async function createItem(request: SaveItemRequest): Promise<Item> {
  return upsertItem({ ...request, id: new Types.ObjectId().toHexString() });
}

export async function getItem(id: string): Promise<Item> {
  const doc = await ItemModel.findById(id).lean<ItemDoc>();
  if (!doc) throw notFound(id);
  return toItem(doc);
}

/** Full replace. 404 if the item does not exist (use `upsertItem` to create by id). */
export async function replaceItem(id: string, request: SaveItemRequest): Promise<Item> {
  const doc = await ItemModel.findOneAndReplace({ _id: id }, toItemDoc({ ...request, id }), {
    returnDocument: "after",
  }).lean<ItemDoc>();
  if (!doc) throw notFound(id);
  return toItem(doc);
}

export async function listItems(query: ItemListQuery): Promise<Paginated<Item>> {
  const { page, pageSize, search, category, active } = query;
  const filter: QueryFilter<ItemDoc> = {};
  if (search) filter.name = { $regex: escapeRegex(search), $options: "i" };
  if (category) filter.category = category;
  if (active !== undefined) filter.active = active;

  const [docs, total] = await Promise.all([
    ItemModel.find(filter)
      .sort(CATALOG_SORT)
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean<ItemDoc[]>(),
    ItemModel.countDocuments(filter),
  ]);
  return { items: docs.map(toItem), page, pageSize, total };
}

/** Every category in use across all items, active or not, sorted. */
export async function listCategories(): Promise<string[]> {
  const categories = await ItemModel.distinct("category");
  return categories.sort((a, b) => a.localeCompare(b));
}

export async function getItemPrices(id: string): Promise<PricesResponse> {
  await getItem(id);
  return listPrices("item", id);
}

export async function setItemPrices(
  id: string,
  request: SetPricesRequest,
): Promise<PricesResponse> {
  await getItem(id);
  return setPrices("item", id, request.prices);
}
