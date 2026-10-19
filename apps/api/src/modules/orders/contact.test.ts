import { describe, expect, it } from "vitest";

import { contactMatches, normalisePhone } from "./contact";

const stored = { name: "Sara", email: "Sara@Example.com", phone: "+92 300-1234567" };

describe("contactMatches", () => {
  it("matches the phone however it is typed", () => {
    for (const typed of [
      "+92 300-1234567",
      "923001234567",
      "(92) 300 1234567",
      " +923001234567 ",
    ]) {
      expect(contactMatches(stored, typed)).toBe(true);
    }
  });
  it("matches the email regardless of case and spaces", () => {
    expect(contactMatches(stored, " sara@example.COM ")).toBe(true);
  });
  it("does not match another phone or email, or a partial phone", () => {
    expect(contactMatches(stored, "+92 300 7654321")).toBe(false);
    expect(contactMatches(stored, "other@example.com")).toBe(false);
    expect(contactMatches(stored, "1234567")).toBe(false);
  });
  it("never matches an empty or too short value", () => {
    expect(contactMatches(stored, "")).toBe(false);
    expect(contactMatches(stored, "123")).toBe(false);
    expect(contactMatches({ ...stored, phone: "" }, "")).toBe(false);
  });
  it("normalises phones to digits", () => {
    expect(normalisePhone("+92 (300) 123-4567")).toBe("923001234567");
  });
});
