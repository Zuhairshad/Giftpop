import { describe, expect, it } from "vitest";

import { loginErrorMessage } from "./login-errors";

import { ApiError } from "@/lib/api";

describe("loginErrorMessage", () => {
  it("explains wrong credentials", () => {
    const error = new ApiError(401, { code: "INVALID_CREDENTIALS", message: "x" });
    expect(loginErrorMessage(error)).toMatch(/email or password is not right/);
  });

  it("explains rate limiting", () => {
    const error = new ApiError(429, { code: "RATE_LIMITED", message: "x" });
    expect(loginErrorMessage(error)).toMatch(/Too many sign-in attempts/);
  });

  it("explains a network failure", () => {
    const error = new ApiError(0, {
      code: "NETWORK_ERROR",
      message: "Could not reach the server.",
    });
    expect(loginErrorMessage(error)).toMatch(/Could not reach the server/);
  });

  it("explains a server error", () => {
    const error = new ApiError(503, { code: "UNEXPECTED_RESPONSE", message: "x" });
    expect(loginErrorMessage(error)).toMatch(/server had a problem/);
  });

  it("falls back for anything else", () => {
    expect(loginErrorMessage(new Error("boom"))).toBe("Could not sign you in. Try again.");
  });
});
