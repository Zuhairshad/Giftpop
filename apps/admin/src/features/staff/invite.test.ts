import { PASSWORD_MIN_LENGTH } from "@giftpop/contracts";
import { describe, expect, it } from "vitest";

import { generateTemporaryPassword, validateInvite } from "./invite";

const VALID = {
  name: "Sam Lee",
  email: " sam@giftpop.test ",
  role: "staff",
  password: "a-long-enough-pw",
};

describe("validateInvite", () => {
  it("accepts valid values and trims the email", () => {
    const result = validateInvite(VALID);
    expect(result).toEqual({
      ok: true,
      data: {
        name: "Sam Lee",
        email: "sam@giftpop.test",
        role: "staff",
        password: "a-long-enough-pw",
      },
    });
  });

  it("asks for every empty field", () => {
    const result = validateInvite({ name: "", email: "", role: "", password: "" });
    expect(result).toEqual({
      ok: false,
      errors: {
        name: "Enter the person's name.",
        email: "Enter an email address.",
        role: "Choose a role.",
        password: "Enter a temporary password, or generate one.",
      },
    });
  });

  it("rejects a malformed email", () => {
    const result = validateInvite({ ...VALID, email: "sam@" });
    expect(result).toEqual({ ok: false, errors: { email: "Enter a valid email address." } });
  });

  it("rejects a password shorter than the contract minimum", () => {
    const result = validateInvite({ ...VALID, password: "x".repeat(PASSWORD_MIN_LENGTH - 1) });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.password).toContain(String(PASSWORD_MIN_LENGTH));
  });

  it("rejects an unknown role and an over-long name", () => {
    const result = validateInvite({ ...VALID, role: "admin", name: "n".repeat(81) });
    expect(result).toEqual({
      ok: false,
      errors: { name: "Use a name of 80 characters or fewer.", role: "Choose owner or staff." },
    });
  });
});

describe("generateTemporaryPassword", () => {
  it("is long enough for the contract and drawn from the safe alphabet", () => {
    const password = generateTemporaryPassword();
    expect(password.length).toBeGreaterThanOrEqual(PASSWORD_MIN_LENGTH);
    expect(password).toMatch(/^[A-HJKMNP-Z2-9_]+$/);
    expect(validateInvite({ ...VALID, password }).ok).toBe(true);
  });

  it("maps every byte to a character without bias", () => {
    const seen = new Set<string>();
    for (let start = 0; start < 256; start += 16) {
      const password = generateTemporaryPassword((bytes) => {
        bytes.forEach((_, i) => (bytes[i] = start + i));
        return bytes;
      });
      for (const char of password) seen.add(char);
    }
    expect(seen.size).toBe(32);
  });

  it("differs between calls", () => {
    expect(generateTemporaryPassword()).not.toBe(generateTemporaryPassword());
  });
});
