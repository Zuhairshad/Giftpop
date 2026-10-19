import { safeNextPath } from "./safe-next";

export interface GateInput {
  pathname: string;
  search: string;
  hasSessionCookie: boolean;
}

/**
 * The cheap gate that runs before rendering: a request with no session cookie goes to the login page
 * (with a `next` param to come back to). It only checks that a cookie exists. Every dashboard page and
 * every API route still verifies the session on the server.
 * Returns the path to redirect to, or null to let the request through.
 */
export function gateRedirect({ pathname, search, hasSessionCookie }: GateInput): string | null {
  if (hasSessionCookie) return null;
  if (pathname === "/login" || pathname.startsWith("/login/")) return null;
  const next = safeNextPath(`${pathname}${search}`);
  return next === "/" ? "/login" : `/login?next=${encodeURIComponent(next)}`;
}
