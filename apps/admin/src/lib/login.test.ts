import { describe, expect, it } from "vitest";

import { validateLogin } from "./login";

describe("validateLogin", () => {
  it("accepts a valid email and a password and trims the email", () => {
    const result = validateLogin({ email: "  owner@giftpop.test ", password: "secret" });
    expect(result).toEqual({ ok: true, data: { email: "owner@giftpop.test", password: "secret" } });
  });

  it("asks for both fields when empty", () => {
    const result = validateLogin({ email: "", password: "" });
    expect(result).toEqual({
      ok: false,
      errors: { email: "Enter your email address.", password: "Enter your password." },
    });
  });

  it("rejects a malformed email", () => {
    const result = validateLogin({ email: "not-an-email", password: "secret" });
    expect(result).toEqual({ ok: false, errors: { email: "Enter a valid email address." } });
  });

  it("rejects an over-long password", () => {
    const result = validateLogin({ email: "a@b.co", password: "x".repeat(201) });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.password).toBe("Enter a password under 200 characters.");
  });
});
