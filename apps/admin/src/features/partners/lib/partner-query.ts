import {
  CountryParamSchema,
  PartnerRequestKindSchema,
  PartnerRequestStatusSchema,
} from "@giftpop/contracts";
import type { PartnerRequestKind, PartnerRequestStatus } from "@giftpop/contracts";

export const PARTNERS_PAGE_SIZE = 20;
export const DEFAULT_KIND: PartnerRequestKind = "brand";

export interface PartnerFilters {
  kind: PartnerRequestKind;
  status?: PartnerRequestStatus | undefined;
  /** Upper-case country code. */
  country?: string | undefined;
  page: number;
}

interface ParamReader {
  get(name: string): string | null;
}

/** Reads the URL query. Bad values fall back to the defaults. */
export function parsePartnerFilters(params: ParamReader): PartnerFilters {
  const kind = PartnerRequestKindSchema.safeParse(params.get("kind"));
  const status = PartnerRequestStatusSchema.safeParse(params.get("status"));
  const country = CountryParamSchema.safeParse(params.get("country"));
  const page = Number(params.get("page"));
  return {
    kind: kind.success ? kind.data : DEFAULT_KIND,
    status: status.success ? status.data : undefined,
    country: country.success ? country.data : undefined,
    page: Number.isInteger(page) && page > 1 ? page : 1,
  };
}

function build(filters: PartnerFilters, includeDefaults: boolean, pageSize?: number): string {
  const params = new URLSearchParams();
  if (includeDefaults || filters.kind !== DEFAULT_KIND) params.set("kind", filters.kind);
  if (filters.status) params.set("status", filters.status);
  if (filters.country) params.set("country", filters.country);
  if (filters.page > 1) params.set("page", String(filters.page));
  if (pageSize !== undefined) params.set("pageSize", String(pageSize));
  const text = params.toString();
  return text === "" ? "" : `?${text}`;
}

/** The page URL's query: defaults left out. */
export function partnerQueryString(filters: PartnerFilters): string {
  return build(filters, false);
}

/** The API query: always names the kind and page size. */
export function partnerApiQuery(filters: PartnerFilters, pageSize = PARTNERS_PAGE_SIZE): string {
  return build(filters, true, pageSize);
}

export function pageCount(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}
