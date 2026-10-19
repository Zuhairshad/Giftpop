import {
  AssetUploadResponseSchema,
  CountrySchema,
  PackagingSchema,
  PricesResponseSchema,
  SetPricesRequestSchema,
  UpdateAssetAnchorRequestSchema,
} from "@giftpop/contracts";
import type {
  AssetRecord,
  Country,
  CreateCountryRequest,
  Item,
  Packaging,
  PriceEntry,
  PricesResponse,
  SaveItemRequest,
  SavePackagingRequest,
  UpdateCountryRequest,
} from "@giftpop/contracts";

import type { Anchor } from "../lib/anchor";

import { ItemResponseSchema } from "./schemas";

import { apiFetch } from "@/lib/api";

/** Browser-side calls for the catalog screens. Each one parses its response with a contract schema. */

export function saveItem(id: string | undefined, body: SaveItemRequest): Promise<Item> {
  return apiFetch(id ? `/catalog/admin/items/${id}` : "/catalog/admin/items", ItemResponseSchema, {
    method: id ? "PUT" : "POST",
    body,
  });
}

export function savePackaging(
  id: string | undefined,
  body: SavePackagingRequest,
): Promise<Packaging> {
  return apiFetch(
    id ? `/catalog/admin/packagings/${id}` : "/catalog/admin/packagings",
    PackagingSchema,
    { method: id ? "PUT" : "POST", body },
  );
}

export type PriceTarget = "items" | "packagings";

/** One bulk call for every country's price and stock. */
export function savePrices(
  target: PriceTarget,
  id: string,
  entries: readonly PriceEntry[],
): Promise<PricesResponse> {
  const body = SetPricesRequestSchema.parse({ prices: entries });
  return apiFetch(`/catalog/admin/${target}/${id}/prices`, PricesResponseSchema, {
    method: "PUT",
    body,
  });
}

export function createCountry(body: CreateCountryRequest): Promise<Country> {
  return apiFetch("/countries", CountrySchema, { method: "POST", body });
}

export function updateCountry(code: string, body: UpdateCountryRequest): Promise<Country> {
  return apiFetch(`/countries/${code}`, CountrySchema, { method: "PUT", body });
}

export interface AssetCallOptions {
  fetchImpl?: typeof fetch;
  /** Override for tests. Defaults to the Next.js `/api` rewrite. */
  baseUrl?: string;
}

/** Uploads an image as multipart form data (field `file`). */
export async function uploadAsset(
  file: File,
  options: AssetCallOptions = {},
): Promise<AssetRecord> {
  const form = new FormData();
  form.append("file", file);
  const { asset } = await apiFetch("/assets", AssetUploadResponseSchema, {
    method: "POST",
    body: form,
    ...options,
  });
  return asset;
}

/** Saves a moved anchor on a stored asset. Returns the asset with the new anchor. */
export async function updateAssetAnchor(assetId: string, anchor: Anchor): Promise<AssetRecord> {
  const body = UpdateAssetAnchorRequestSchema.parse({ anchor });
  const { asset } = await apiFetch(`/assets/${assetId}`, AssetUploadResponseSchema, {
    method: "PATCH",
    body,
  });
  return asset;
}
