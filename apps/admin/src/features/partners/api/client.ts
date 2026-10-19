import { CountrySchema, PartnerRequestSchema, paginatedSchema } from "@giftpop/contracts";
import type { Country, PartnerRequest, UpdatePartnerRequest } from "@giftpop/contracts";
import { z } from "zod";

import { partnerApiQuery } from "../lib/partner-query";
import type { PartnerFilters } from "../lib/partner-query";

import { apiFetch } from "@/lib/api";

/** Browser-side calls for the partner inbox. Each response is parsed with a contract schema. */

const PartnerPageSchema = paginatedSchema(PartnerRequestSchema);
export type PartnerPage = z.infer<typeof PartnerPageSchema>;

export function listPartnerRequests(
  filters: PartnerFilters,
  signal?: AbortSignal,
): Promise<PartnerPage> {
  return apiFetch(`/partner-requests/admin${partnerApiQuery(filters)}`, PartnerPageSchema, {
    ...(signal ? { signal } : {}),
  });
}

export function updatePartnerRequest(
  id: string,
  body: UpdatePartnerRequest,
): Promise<PartnerRequest> {
  return apiFetch(`/partner-requests/admin/${id}`, PartnerRequestSchema, {
    method: "PATCH",
    body,
  });
}

export function listCountries(signal?: AbortSignal): Promise<Country[]> {
  return apiFetch("/countries/admin", z.array(CountrySchema), {
    ...(signal ? { signal } : {}),
  });
}
