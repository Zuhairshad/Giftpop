import type {
  Packaging,
  Paginated,
  PaginationQuery,
  PricesResponse,
  SavePackagingRequest,
  SetPricesRequest,
} from "@giftpop/contracts";
import { LAYOUT_TYPES, isKnownLayoutType } from "@giftpop/renderer/layouts";
import { Types } from "mongoose";

import { AppError } from "../../lib/errors";

import { toPackaging, toPackagingDoc } from "./mappers";
import { CATALOG_SORT, PackagingModel, type PackagingDoc } from "./model";
import { listPrices, setPrices } from "./prices.service";

function notFound(id: string): AppError {
  return new AppError("NOT_FOUND", 404, `No packaging with id ${id}`);
}

/** A packaging may only name a layout the renderer can draw (CLAUDE.md rule 8). */
function assertKnownLayoutType(layoutType: string): void {
  if (!isKnownLayoutType(layoutType)) {
    throw new AppError("VALIDATION_ERROR", 422, `Unknown layoutType "${layoutType}"`, {
      field: "layoutType",
      allowed: LAYOUT_TYPES,
    });
  }
}

/** Creates the packaging or replaces it, keyed by `id`. Idempotent. */
export async function upsertPackaging(packaging: Packaging): Promise<Packaging> {
  assertKnownLayoutType(packaging.layoutType);
  const doc = await PackagingModel.findOneAndReplace(
    { _id: packaging.id },
    toPackagingDoc(packaging),
    { upsert: true, returnDocument: "after" },
  ).lean<PackagingDoc>();
  return toPackaging(doc);
}

export async function createPackaging(request: SavePackagingRequest): Promise<Packaging> {
  return upsertPackaging({ ...request, id: new Types.ObjectId().toHexString() });
}

export async function getPackaging(id: string): Promise<Packaging> {
  const doc = await PackagingModel.findById(id).lean<PackagingDoc>();
  if (!doc) throw notFound(id);
  return toPackaging(doc);
}

/** Full replace. 404 if the packaging does not exist. */
export async function replacePackaging(
  id: string,
  request: SavePackagingRequest,
): Promise<Packaging> {
  assertKnownLayoutType(request.layoutType);
  const doc = await PackagingModel.findOneAndReplace(
    { _id: id },
    toPackagingDoc({ ...request, id }),
    { returnDocument: "after" },
  ).lean<PackagingDoc>();
  if (!doc) throw notFound(id);
  return toPackaging(doc);
}

export async function listPackagings(query: PaginationQuery): Promise<Paginated<Packaging>> {
  const { page, pageSize } = query;
  const [docs, total] = await Promise.all([
    PackagingModel.find()
      .sort(CATALOG_SORT)
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean<PackagingDoc[]>(),
    PackagingModel.countDocuments(),
  ]);
  return { items: docs.map(toPackaging), page, pageSize, total };
}

export async function getPackagingPrices(id: string): Promise<PricesResponse> {
  await getPackaging(id);
  return listPrices("packaging", id);
}

export async function setPackagingPrices(
  id: string,
  request: SetPricesRequest,
): Promise<PricesResponse> {
  await getPackaging(id);
  return setPrices("packaging", id, request.prices);
}
