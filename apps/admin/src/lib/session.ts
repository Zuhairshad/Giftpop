import type { Session } from "@giftpop/contracts";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { fetchSession } from "@/features/auth/fetch-session";

/**
 * Server only. Reads the signed-in staff member from the API, forwarding the browser's cookie.
 * Redirects to the login page when there is no valid session. Cached for one request.
 */
export const getSession = cache(async (): Promise<Session> => {
  const cookieHeader = (await cookies()).toString();
  const session = cookieHeader === "" ? null : await fetchSession(cookieHeader);
  if (!session) redirect("/login");
  return session;
});

/** Server only. Like `getSession`, and sends non-owners back to the dashboard. */
export async function requireOwner(): Promise<Session> {
  const session = await getSession();
  if (session.user.role !== "owner") redirect("/");
  return session;
}
