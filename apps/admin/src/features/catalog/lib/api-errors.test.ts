import { describe, expect, it } from "vitest";

import { fieldErrorsFromDetails, readApiError } from "./api-errors";

import { ApiError } from "@/lib/api";

describe("fieldErrorsFromDetails", () => {
  it("reads a list of zod issues", () => {
    expect(
      fieldErrorsFromDetails([
        { path: ["shipping", "flatMinor"], message: "Too small" },
        { path: ["layers", 0, "url"], message: "Bad url" },
      ]),
    ).toEqual([
      { path: "shipping.flatMinor", message: "Too small" },
      { path: "layers.0.url", message: "Bad url" },
    ]);
  });

  it("reads issues nested under an `issues` key", () => {
    expect(fieldErrorsFromDetails({ issues: [{ path: ["name"], message: "Required" }] })).toEqual([
      { path: "name", message: "Required" },
    ]);
  });

  it("skips entries with no path or message", () => {
    expect(
      fieldErrorsFromDetails([{ path: [], message: "Root" }, { path: ["a"] }, null, "x"]),
    ).toEqual([]);
  });

  it("returns an empty list for unknown shapes", () => {
    expect(fieldErrorsFromDetails(undefined)).toEqual([]);
    expect(fieldErrorsFromDetails("nope")).toEqual([]);
  });
});

describe("readApiError", () => {
  it("uses the API message and field errors", () => {
    const error = new ApiError(400, {
      code: "VALIDATION_ERROR",
      message: "Invalid request",
      details: [{ path: ["name"], message: "Required" }],
    });
    expect(readApiError(error)).toEqual({
      message: "Invalid request",
      fields: [{ path: "name", message: "Required" }],
    });
  });

  it("explains a forbidden answer", () => {
    const error = new ApiError(403, { code: "FORBIDDEN", message: "Forbidden" });
    expect(readApiError(error).message).toBe("Your account is not allowed to do this.");
  });

  it("gives a generic message for other errors", () => {
    expect(readApiError(new Error("boom")).message).toBe("Something went wrong. Try again.");
  });
});
