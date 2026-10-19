import {
  AssetUploadResponseSchema,
  ErrorResponseSchema,
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

import { CountryResponseSchema, ItemResponseSchema, PackagingResponseSchema } from "./schemas";

import { ApiError, apiFetch } from "@/lib/api";

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
    PackagingResponseSchema,
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
  return apiFetch("/countries", CountryResponseSchema, { method: "POST", body });
}

export function updateCountry(code: string, body: UpdateCountryRequest): Promise<Country> {
  return apiFetch(`/countries/${code}`, CountryResponseSchema, { method: "PUT", body });
}

export interface AssetCallOptions {
  fetchImpl?: typeof fetch;
  /** Override for tests. Defaults to the Next.js `/api` rewrite. */
  baseUrl?: string;
}

/**
 * Uploads an image as multipart form data (field `file`). `apiFetch` only sends JSON,
 * so this talks to `fetch` directly and reads the answer the same way.
 */
export async function uploadAsset(
  file: File,
  { fetchImpl = fetch, baseUrl = "/api" }: AssetCallOptions = {},
): Promise<AssetRecord> {
  const form = new FormData();
  form.append("file", file);

  let response: Response;
  try {
    response = await fetchImpl(`${baseUrl}/assets`, {
      method: "POST",
      credentials: "include",
      headers: { Accept: "application/json" },
      body: form,
    });
  } catch {
    throw new ApiError(0, { code: "NETWORK_ERROR", message: "Could not reach the server." });
  }

  const payload = await readBody(response);
  if (!response.ok) throw toApiError(response.status, payload);

  const parsed = AssetUploadResponseSchema.safeParse(payload);
  if (!parsed.success) {
    throw new ApiError(response.status, {
      code: "INVALID_RESPONSE",
      message: "The server sent a response in an unexpected shape.",
      details: parsed.error.issues,
    });
  }
  return parsed.data.asset;
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

async function readBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (text === "") return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

function toApiError(status: number, payload: unknown): ApiError {
  const parsed = ErrorResponseSchema.safeParse(payload);
  if (parsed.success) return new ApiError(status, parsed.data.error);
  return new ApiError(status, {
    code: "UNEXPECTED_RESPONSE",
    message: `The server answered with status ${status}.`,
  });
}
