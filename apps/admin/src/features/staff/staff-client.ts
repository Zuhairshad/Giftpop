import { StaffUserSchema } from "@giftpop/contracts";
import type { CreateStaffRequest, StaffUser, UpdateStaffRequest } from "@giftpop/contracts";
import { z } from "zod";

import { apiFetch } from "@/lib/api";

const StaffListSchema = z.array(StaffUserSchema);

/** Server only: pass the incoming request's cookie header, the API needs it to know who is asking. */
export function fetchStaff(cookieHeader: string): Promise<StaffUser[]> {
  return apiFetch("/staff", StaffListSchema, { headers: { cookie: cookieHeader } });
}

/** Browser call. */
export function createStaff(request: CreateStaffRequest): Promise<StaffUser> {
  return apiFetch("/staff", StaffUserSchema, { method: "POST", body: request });
}

/** Browser call. */
export function updateStaff(id: string, request: UpdateStaffRequest): Promise<StaffUser> {
  return apiFetch(`/staff/${encodeURIComponent(id)}`, StaffUserSchema, {
    method: "PATCH",
    body: request,
  });
}
