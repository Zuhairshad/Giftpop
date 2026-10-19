import { SessionSchema } from "@giftpop/contracts";
import type { Session } from "@giftpop/contracts";

import { apiFetch, isApiError } from "@/lib/api";

/**
 * Asks the API who the cookie belongs to. Returns null when the API says the session is missing,
 * expired or ended (401). Any other failure throws so the page shows an error, not a login loop.
 */
export async function fetchSession(
  cookieHeader: string,
  fetchImpl?: typeof fetch,
): Promise<Session | null> {
  try {
    return await apiFetch("/auth/me", SessionSchema, {
      headers: { cookie: cookieHeader },
      ...(fetchImpl ? { fetchImpl } : {}),
    });
  } catch (error) {
    if (isApiError(error) && error.status === 401) return null;
    throw error;
  }
}
