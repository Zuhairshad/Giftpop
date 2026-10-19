import { PricesResponseSchema, SessionSchema, StaffUserSchema } from "@giftpop/contracts";
import type { ItemListQuery } from "@giftpop/contracts";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { z } from "zod";

import {
  CategoryListSchema,
  CountryListSchema,
  ItemPageSchema,
  ItemResponseSchema,
  PackagingListSchema,
  PackagingResponseSchema,
} from "./schemas";

import { apiFetch, isApiError } from "@/lib/api";

/** Server Component loaders. They forward the incoming session cookie to the API. */

async function getRaw<S extends z.ZodType>(path: string, schema: S): Promise<z.infer<S>> {
  const cookie = (await headers()).get("cookie");
  return apiFetch(path, schema, { headers: cookie ? { cookie } : {} });
}

/** Like `getRaw`, but a 401 sends the user to sign in and a 404 shows the not-found page. */
async function get<S extends z.ZodType>(path: string, schema: S): Promise<z.infer<S>> {
  try {
    return await getRaw(path, schema);
  } catch (error) {
    if (isApiError(error) && error.status === 401) redirect("/login");
    if (isApiError(error) && error.status === 404) notFound();
    throw error;
  }
}

export function loadCountries() {
  return get("/countries/admin", CountryListSchema);
}

export function loadItems(query: Partial<ItemListQuery>) {
  const params = new URLSearchParams();
  if (query.page) params.set("page", String(query.page));
  if (query.pageSize) params.set("pageSize", String(query.pageSize));
  if (query.search) params.set("search", query.search);
  if (query.category) params.set("category", query.category);
  if (query.active !== undefined) params.set("active", String(query.active));
  const qs = params.toString();
  return get(`/catalog/admin/items${qs ? `?${qs}` : ""}`, ItemPageSchema);
}

export function loadItem(id: string) {
  return get(`/catalog/admin/items/${encodeURIComponent(id)}`, ItemResponseSchema);
}

export function loadItemPrices(id: string) {
  return get(`/catalog/admin/items/${encodeURIComponent(id)}/prices`, PricesResponseSchema);
}

export function loadCategories() {
  return get("/catalog/admin/categories", CategoryListSchema);
}

export function loadPackagings() {
  return get("/catalog/admin/packagings", PackagingListSchema);
}

export function loadPackaging(id: string) {
  return get(`/catalog/admin/packagings/${encodeURIComponent(id)}`, PackagingResponseSchema);
}

export function loadPackagingPrices(id: string) {
  return get(`/catalog/admin/packagings/${encodeURIComponent(id)}/prices`, PricesResponseSchema);
}

export type ViewerRole = "owner" | "staff" | "unknown";

/**
 * The signed-in user's role, read from `/auth/me`. Only used to hide controls that the
 * API would refuse anyway; "unknown" (an unexpected answer) keeps them visible.
 */
export async function loadViewerRole(): Promise<ViewerRole> {
  try {
    const me = await getRaw("/auth/me", SessionSchema.or(StaffUserSchema));
    return "user" in me ? me.user.role : me.role;
  } catch (error) {
    if (isApiError(error) && error.status === 403) return "staff";
    return "unknown";
  }
}
