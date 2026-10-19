// Test helpers shared by the countries and catalog tests. Not imported by app code.
import type { Country, StaffRole } from "@giftpop/contracts";
import type { RequestHandler } from "express";

import { AppError } from "../../lib/errors";

export function makeCountry(overrides: Partial<Country> = {}): Country {
  return {
    code: "PK",
    name: "Pakistan",
    currency: "PKR",
    status: "live",
    paymentModes: ["prepaid", "cod"],
    shipping: { flatMinor: 25_000, freeOverMinor: 500_000, deliveryDays: { min: 3, max: 6 } },
    addressFormat: {
      region: { required: true, label: "Province" },
      postalCode: { required: false, label: "Postcode" },
    },
    paymentInstructions: "Bank: 1234 5678 (DEV ONLY)",
    ...overrides,
  };
}

/**
 * Stand-in for `middleware/require-staff` in route tests. The role comes from the
 * `x-test-role` header: missing is 401, a lower role than required is 403.
 * Use as: `vi.mock("../../middleware/require-staff", async () =>
 * (await import("../countries/fixtures")).fakeRequireStaffModule())`.
 */
export function fakeRequireStaffModule(): { requireStaff: (role?: StaffRole) => RequestHandler } {
  return {
    requireStaff: (required) => (req, _res, next) => {
      const header = req.header("x-test-role");
      if (header !== "owner" && header !== "staff") {
        next(new AppError("UNAUTHENTICATED", 401, "Sign in to continue"));
        return;
      }
      if (required === "owner" && header !== "owner") {
        next(new AppError("FORBIDDEN", 403, "Owners only"));
        return;
      }
      req.staff = {
        id: "a".repeat(24),
        email: "tester@example.com",
        name: "Tester",
        role: header,
        active: true,
        createdAt: new Date(0).toISOString(),
      };
      next();
    },
  };
}
