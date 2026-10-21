import { describe, expect, it } from "vitest";

import {
  NOT_FOUND_MESSAGE,
  describeLookupError,
  parseLookupInput,
  parseForgotInput,
  FORGOT_CONTACT_ERROR,
} from "./lookup";

import { ApiError, ApiNetworkError } from "@/lib/api";

describe("parseLookupInput", () => {
  it("upper-cases the number and trims the contact", () => {
    const result = parseLookupInput({ number: " gp-pk-7k2m9q ", contact: "  a@b.co " });
    expect(result).toEqual({ ok: true, value: { number: "GP-PK-7K2M9Q", contact: "a@b.co" } });
  });
  it("reports a bad number and a short contact separately", () => {
    const result = parseLookupInput({ number: "GP-PK-ILOU00", contact: "x" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.number).toBeDefined();
      expect(result.errors.contact).toBeDefined();
    }
  });
});

describe("describeLookupError", () => {
  it("answers one generic message for 404", () => {
    const failure = describeLookupError(new ApiError(404, { code: "NOT_FOUND", message: "x" }));
    expect(failure).toEqual({ kind: "not_found", message: NOT_FOUND_MESSAGE });
  });
  it("tells a rate limit apart", () => {
    const failure = describeLookupError(new ApiError(429, { code: "RATE_LIMITED", message: "x" }));
    expect(failure.kind).toBe("rate_limited");
  });
  it("handles network and unknown errors", () => {
    expect(describeLookupError(new ApiNetworkError("offline")).kind).toBe("network");
    expect(describeLookupError(new Error("boom")).kind).toBe("other");
  });
});

describe("parseForgotInput", () => {
  it("accepts an email or phone and trims it", () => {
    expect(parseForgotInput("  sara@example.com ")).toEqual({
      ok: true,
      value: { contact: "sara@example.com" },
    });
  });

  it("asks for the phone or email when it is empty or too short", () => {
    expect(parseForgotInput("")).toEqual({ ok: false, error: FORGOT_CONTACT_ERROR });
    expect(parseForgotInput("ab")).toEqual({ ok: false, error: FORGOT_CONTACT_ERROR });
  });
});
