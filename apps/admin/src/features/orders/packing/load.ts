import { AdminOrderDetailSchema } from "@giftpop/contracts";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { apiFetch, isApiError } from "@/lib/api";

/** Server only. Loads one order for the packing sheet, forwarding the staff cookie. */
export async function loadPackingOrder(id: string) {
  const cookie = (await headers()).get("cookie");
  try {
    return await apiFetch(`/admin/orders/${encodeURIComponent(id)}`, AdminOrderDetailSchema, {
      headers: cookie ? { cookie } : {},
    });
  } catch (error) {
    if (isApiError(error) && error.status === 401) redirect("/login");
    if (isApiError(error) && (error.status === 404 || error.status === 400)) notFound();
    throw error;
  }
}
