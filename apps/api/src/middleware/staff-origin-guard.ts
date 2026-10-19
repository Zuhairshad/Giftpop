import type { Request } from "express";

import { parseEnv } from "../env";
import { AppError } from "../lib/errors";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

let cachedAdminOrigin: string | undefined;

/** `ADMIN_ORIGIN` from the validated env, read once (same pattern as the auth config). */
function adminOrigin(): string {
  cachedAdminOrigin ??= new URL(
    parseEnv({ MONGODB_URI: "mongodb://unused", ...process.env }).ADMIN_ORIGIN,
  ).origin;
  return cachedAdminOrigin;
}

/**
 * CSRF defence in depth for staff routes, called by `requireStaff` once a session is found.
 * `SameSite=Lax` already keeps the cookie off cross-site POSTs, but the store and the admin
 * app are the same site (sibling subdomains) and both are in the CORS allowlist with
 * credentials. So a state-changing request with a staff session must come from the admin
 * origin. Browsers always send `Origin` on POST, PUT, PATCH and DELETE; a request with no
 * `Origin` (server to server, curl) is not a browser CSRF and passes.
 */
export function assertStaffOrigin(req: Request, allowedOrigin: string = adminOrigin()): void {
  const origin = req.header("origin");
  if (SAFE_METHODS.has(req.method) || origin === undefined || origin === allowedOrigin) return;
  throw new AppError("FORBIDDEN", 403, "This request did not come from the admin app");
}
