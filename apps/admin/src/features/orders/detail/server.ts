import { AdminOrderDetailSchema } from "@giftpop/contracts";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { apiFetch, isApiError } from "@/lib/api";

/** Server only. Loads one order with the incoming session cookie. 401 goes to sign in, 404 to not-found. */
export async function loadOrder(id: string) {
  const cookie = (await headers()).get("cookie");
  try {
    return await apiFetch(`/admin/orders/${encodeURIComponent(id)}`, AdminOrderDetailSchema, {
      headers: cookie ? { cookie } : {},
    });
  } catch (error) {
    if (isApiError(error) && error.status === 401) redirect("/login");
    if (isApiError(error) && error.status === 404) notFound();
    throw error;
  }
}
