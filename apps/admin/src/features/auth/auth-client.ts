import { SessionSchema } from "@giftpop/contracts";
import type { LoginRequest, Session } from "@giftpop/contracts";
import { z } from "zod";

import { apiFetch } from "@/lib/api";

/** Browser call: the API sets the httpOnly session cookie on its response. */
export function signIn(credentials: LoginRequest): Promise<Session> {
  return apiFetch("/auth/login", SessionSchema, { method: "POST", body: credentials });
}

/** Browser call: the API clears the cookie and ends the session. */
export async function signOut(): Promise<void> {
  await apiFetch("/auth/logout", z.undefined(), { method: "POST" });
}
