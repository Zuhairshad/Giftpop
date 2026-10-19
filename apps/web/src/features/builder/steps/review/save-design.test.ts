import { describe, expect, it } from "vitest";

import { describeSaveError } from "./save-design";

import { ApiError, ApiNetworkError } from "@/lib/api-errors";


describe("describeSaveError", () => {
  it("passes on the network message", () => {
    expect(describeSaveError(new ApiNetworkError("Could not reach the server."))).toBe(
      "Could not reach the server.",
    );
  });

  it("explains an invalid design", () => {
    const error = new ApiError(422, { code: "DESIGN_INVALID", message: "bad" });
    expect(describeSaveError(error)).toMatch(/cannot be saved yet/);
  });

  it("falls back to a generic message and never leaks details", () => {
    const error = new ApiError(500, { code: "INTERNAL", message: "stack trace here" });
    expect(describeSaveError(error)).toBe("We could not save your gift. Try again in a moment.");
  });
});
