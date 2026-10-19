import { DashboardSummarySchema } from "@giftpop/contracts";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { apiFetch, isApiError } from "@/lib/api";

/** Server only. Returns the summary, or null when the API fails (the screen shows an error tile). */
export async function loadDashboard() {
  const cookie = (await headers()).get("cookie");
  try {
    return await apiFetch("/admin/dashboard", DashboardSummarySchema, {
      headers: cookie ? { cookie } : {},
    });
  } catch (error) {
    if (isApiError(error) && error.status === 401) redirect("/login");
    return null;
  }
}
