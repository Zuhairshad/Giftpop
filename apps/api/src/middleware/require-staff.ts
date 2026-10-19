import type { StaffRole } from "@giftpop/contracts";
import type { RequestHandler } from "express";

import { AppError } from "../lib/errors";

/**
 * Admin routes call this first. Loads the staff session from the `gp_admin`
 * cookie and rejects with 401 (no or expired session) or 403 (wrong role).
 * `requireStaff("owner")` limits a route to owners.
 *
 * STUB: denies everything until `api-auth` implements it.
 */
export function requireStaff(_role?: StaffRole): RequestHandler {
  return (_req, _res, next) => {
    next(new AppError("UNAUTHENTICATED", 401, "Sign in to continue"));
  };
}
