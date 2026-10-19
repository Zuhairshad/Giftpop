import { describe, expect, it } from "vitest";

import { staffErrorMessage } from "./staff-errors";

import { ApiError } from "@/lib/api";

describe("staffErrorMessage", () => {
  it("explains a duplicate email", () => {
    const error = new ApiError(409, { code: "CONFLICT", message: "x" });
    expect(staffErrorMessage(error, "add this staff member")).toBe(
      "A staff member with this email already exists.",
    );
  });

  it("explains a missing permission", () => {
    const error = new ApiError(403, { code: "FORBIDDEN", message: "x" });
    expect(staffErrorMessage(error, "add this staff member")).toBe(
      "Only the owner can manage staff.",
    );
  });

  it("shows the API's own message for a validation failure", () => {
    const error = new ApiError(400, {
      code: "VALIDATION_ERROR",
      message: "Password is too common.",
    });
    expect(staffErrorMessage(error, "add this staff member")).toBe("Password is too common.");
  });

  it("explains a network failure", () => {
    const error = new ApiError(0, { code: "NETWORK_ERROR", message: "x" });
    expect(staffErrorMessage(error, "add this staff member")).toMatch(/Could not reach the server/);
  });

  it("falls back to the action", () => {
    expect(staffErrorMessage(new Error("boom"), "deactivate this account")).toBe(
      "Could not deactivate this account. Try again.",
    );
  });
});
