import {
  AdminOrderListQuerySchema,
  ADMIN_ORDERS_PAGE_SIZE,
  type OrderStatus,
  type PaymentStatus,
} from "@giftpop/contracts";

/** What the filter bar edits. Every field is optional; an empty one is simply absent. */
export interface OrderFilters {
  status?: OrderStatus | undefined;
  paymentStatus?: PaymentStatus | undefined;
  country?: string | undefined;
  from?: string | undefined;
  to?: string | undefined;
  search?: string | undefined;
  hasPendingProof?: true | undefined;
}

export type OrderTab = "all" | "needs_payment_check" | "to_make" | "to_ship";

export const ORDER_TABS: readonly { id: OrderTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "needs_payment_check", label: "Needs payment check" },
  { id: "to_make", label: "To make" },
  { id: "to_ship", label: "To ship" },
];

export const SEARCH_DEBOUNCE_MS = 300;

const SHAPE = AdminOrderListQuerySchema.shape;

type ParamSource = Pick<URLSearchParams, "get">;

function clean(value: string | null): string | undefined {
  if (value === null) return undefined;
  const text = value.trim();
  return text === "" ? undefined : text;
}

/** Reads the page URL. A value the contract rejects is dropped, never passed on. */
export function filtersFromParams(params: ParamSource): OrderFilters {
  const filters: OrderFilters = {};
  const status = SHAPE.status.safeParse(clean(params.get("status")));
  if (status.success && status.data) filters.status = status.data;
  const payment = SHAPE.paymentStatus.safeParse(clean(params.get("paymentStatus")));
  if (payment.success && payment.data) filters.paymentStatus = payment.data;
  const country = SHAPE.country.safeParse(clean(params.get("country")));
  if (country.success && country.data) filters.country = country.data;
  const from = SHAPE.from.safeParse(clean(params.get("from")));
  if (from.success && from.data) filters.from = from.data;
  const to = SHAPE.to.safeParse(clean(params.get("to")));
  if (to.success && to.data) filters.to = to.data;
  const search = SHAPE.search.safeParse(clean(params.get("search")));
  if (search.success && search.data) filters.search = search.data;
  if (clean(params.get("hasPendingProof")) === "true") filters.hasPendingProof = true;
  return filters;
}

function toParams(filters: OrderFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.paymentStatus) params.set("paymentStatus", filters.paymentStatus);
  if (filters.country) params.set("country", filters.country);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  const search = filters.search?.trim();
  if (search) params.set("search", search);
  if (filters.hasPendingProof) params.set("hasPendingProof", "true");
  return params;
}

/** The page URL's query string ("" or "?status=..."). Empty values are left out. */
export function filtersToSearch(filters: OrderFilters): string {
  const text = toParams(filters).toString();
  return text === "" ? "" : `?${text}`;
}

/** The API path for one page of the list. Checked with the contract so a bad value never leaves the browser. */
export function buildApiPath(filters: OrderFilters, cursor?: string): string {
  const params = toParams(filters);
  if (cursor) params.set("cursor", cursor);
  params.set("limit", String(ADMIN_ORDERS_PAGE_SIZE));
  const checked = AdminOrderListQuerySchema.safeParse(Object.fromEntries(params));
  if (!checked.success) return `/admin/orders?limit=${ADMIN_ORDERS_PAGE_SIZE}`;
  return `/admin/orders?${params.toString()}`;
}

export function hasAnyFilter(filters: OrderFilters): boolean {
  return filtersToSearch(filters) !== "";
}

/** The tab is derived from status and the proof flag only. A custom status has no tab lit. */
export function activeTab(filters: OrderFilters): OrderTab | null {
  const { status, hasPendingProof } = filters;
  if (!status && !hasPendingProof) return "all";
  if (status === "awaiting_payment" && hasPendingProof) return "needs_payment_check";
  if (status === "confirmed" && !hasPendingProof) return "to_make";
  if (status === "packed" && !hasPendingProof) return "to_ship";
  return null;
}

/** Switches tab and keeps the filters that are not part of any tab (country, dates, search, payment). */
export function applyTab(filters: OrderFilters, tab: OrderTab): OrderFilters {
  const rest: OrderFilters = { ...filters };
  delete rest.status;
  delete rest.hasPendingProof;
  switch (tab) {
    case "all":
      return rest;
    case "needs_payment_check":
      return { ...rest, status: "awaiting_payment", hasPendingProof: true };
    case "to_make":
      return { ...rest, status: "confirmed" };
    case "to_ship":
      return { ...rest, status: "packed" };
  }
}

/** True when the typed search differs from what the URL holds and should be written after the delay. */
export function shouldCommitSearch(typed: string, committed: string | undefined): boolean {
  return typed.trim() !== (committed ?? "").trim();
}
