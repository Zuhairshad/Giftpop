import { describe, expect, it } from "vitest";

import {
  classifyOrderError,
  failureMessage,
  mapDetailsToFields,
  needsItemsLink,
} from "./order-errors";

import { ApiError, ApiNetworkError } from "@/lib/api-errors";

describe("mapDetailsToFields", () => {
  it("maps field/message pairs and accepts dotted paths", () => {
    expect(
      mapDetailsToFields([
        { field: "region", message: "Province is required" },
        { field: "address.postalCode", message: "Postal code is required" },
        { field: "region", message: "ignored duplicate" },
        { field: "design", message: "not a field we show" },
      ]),
    ).toEqual({ region: "Province is required", postalCode: "Postal code is required" });
  });

  it("returns nothing for other shapes", () => {
    expect(mapDetailsToFields(undefined)).toEqual({});
    expect(mapDetailsToFields({ problems: [] })).toEqual({});
    expect(mapDetailsToFields([{ field: 1 }])).toEqual({});
  });
});

describe("classifyOrderError", () => {
  it("maps address validation details to fields", () => {
    const error = new ApiError(422, {
      code: "VALIDATION_ERROR",
      message: "Invalid",
      details: [{ field: "region", message: "State is required" }],
    });
    expect(classifyOrderError(error)).toEqual({
      kind: "fields",
      fields: { region: "State is required" },
    });
  });

  it("recognises the other failures", () => {
    const design = new ApiError(422, {
      code: "DESIGN_INVALID",
      message: "x",
      details: { problems: [] },
    });
    expect(classifyOrderError(design)).toEqual({ kind: "design_invalid" });
    expect(
      classifyOrderError(
        new ApiError(409, {
          code: "CONFLICT",
          message: "x",
          details: { outOfStock: [{ kind: "item", targetId: "a" }] },
        }),
      ),
    ).toEqual({ kind: "sold_out" });
    // A 409 with no stock details (a request already in progress, a reused key) is not "sold out".
    expect(classifyOrderError(new ApiError(409, { code: "CONFLICT", message: "x" }))).toEqual({
      kind: "in_progress",
    });
    expect(classifyOrderError(new ApiError(429, { code: "RATE_LIMITED", message: "x" }))).toEqual({
      kind: "rate_limited",
    });
    expect(classifyOrderError(new ApiNetworkError("offline"))).toEqual({ kind: "offline" });
  });

  it("falls back to generic and never shows raw API text", () => {
    const raw = "MongoServerError: E11000 at /srv/api/x.ts";
    const error = new ApiError(500, { code: "INTERNAL", message: raw });
    const failure = classifyOrderError(error);
    expect(failure).toEqual({ kind: "generic" });
    expect(failureMessage(failure)).not.toContain("Mongo");
    expect(classifyOrderError(new Error("boom"))).toEqual({ kind: "generic" });
    expect(
      classifyOrderError(
        new ApiError(422, { code: "VALIDATION_ERROR", message: "x", details: [] }),
      ),
    ).toEqual({ kind: "generic" });
  });

  it("offers the items link only when the gift itself is the problem", () => {
    expect(needsItemsLink({ kind: "design_invalid" })).toBe(true);
    expect(needsItemsLink({ kind: "sold_out" })).toBe(true);
    expect(needsItemsLink({ kind: "generic" })).toBe(false);
    expect(failureMessage({ kind: "design_invalid" })).toMatch(/Something in your gift changed/);
  });
});
