import type { StaffRole } from "@giftpop/contracts";
import type { RequestHandler } from "express";

import { AppError } from "../lib/errors";
import { readSessionToken } from "../modules/auth/cookie";
import { findActiveSession } from "../modules/auth/sessions";
import { toStaffUser } from "../modules/staff/model";

import { assertStaffOrigin } from "./staff-origin-guard";

/**
 * Admin routes call this first. Loads the staff session from the `gp_admin`
 * cookie and rejects with 401 (no, expired or inactive session) or 403 (wrong role).
 * `requireStaff()` and `requireStaff("staff")` allow any active staff member, owners
 * included; `requireStaff("owner")` limits a route to owners.
 */
export function requireStaff(role?: StaffRole): RequestHandler {
  return async (req, _res, next) => {
    const active = await findActiveSession(readSessionToken(req));
    if (!active) throw new AppError("UNAUTHENTICATED", 401, "Sign in to continue");

    assertStaffOrigin(req);

    const staff = toStaffUser(active.staff);
    if (role === "owner" && staff.role !== "owner") {
      throw new AppError("FORBIDDEN", 403, "Only owners can do this");
    }
    req.staff = staff;
    next();
  };
}
