import { ItemListQuerySchema } from "@giftpop/contracts";
import type { ItemListQuery } from "@giftpop/contracts";

type RawParams = Record<string, string | string[] | undefined>;

export const ITEMS_PAGE_SIZE = 20;

function first(value: string | string[] | undefined): string | undefined {
  const text = Array.isArray(value) ? value[0] : value;
  return text === undefined || text === "" ? undefined : text;
}

/** Reads the page's URL query with the contract's schema. Bad values fall back to defaults. */
export function parseItemsQuery(raw: RawParams): ItemListQuery {
  const candidate = {
    page: first(raw.page),
    pageSize: ITEMS_PAGE_SIZE,
    search: first(raw.search),
    category: first(raw.category),
    active: first(raw.active),
  };
  const parsed = ItemListQuerySchema.safeParse(candidate);
  if (parsed.success) return parsed.data;
  return ItemListQuerySchema.parse({ pageSize: ITEMS_PAGE_SIZE });
}

export interface ItemsUrlState {
  search?: string | undefined;
  category?: string | undefined;
  active?: boolean | undefined;
  page?: number | undefined;
}

/** The query string for the URL. Defaults are left out; changing a filter goes back to page 1. */
export function itemsQueryString(state: ItemsUrlState): string {
  const params = new URLSearchParams();
  const search = state.search?.trim();
  if (search) params.set("search", search);
  if (state.category) params.set("category", state.category);
  if (state.active !== undefined) params.set("active", String(state.active));
  if (state.page !== undefined && state.page > 1) params.set("page", String(state.page));
  const text = params.toString();
  return text === "" ? "" : `?${text}`;
}

export function pageCount(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}
