import { describe, expect, it } from "vitest";

import { maskText, maskValue } from "./mask";

describe("maskText", () => {
  it.each([
    ["mail sara@example.com now", "mail [email] now"],
    ["call +92 300 1234567 please", "call [phone] please"],
    ["call (0300) 123-4567", "call [phone]"],
    ["923001234567", "[phone]"],
    ["two: a.b+c@sub.example.co.uk and 0300-1234567", "two: [email] and [phone]"],
  ])("masks %s", (input, expected) => {
    expect(maskText(input)).toBe(expected);
  });

  it.each(["GP-PK-7K2M9Q", "status 404 took 120 ms", "port 4000", "1.2.3", "order 123456", "ok"])(
    "leaves %s alone",
    (input) => {
      expect(maskText(input)).toBe(input);
    },
  );
});

describe("maskValue", () => {
  it("replaces sensitive keys at any depth, case-insensitively", () => {
    const masked = maskValue({
      a: { Phone: "1", deep: [{ cardMessage: "hi", ok: "fine" }] },
      "set-cookie": "x",
      "x-api-key": "k",
      sessionToken: "t",
      PASSWORD: "p",
      contact: { name: "n" },
      count: 3,
    });
    expect(masked).toEqual({
      a: { Phone: "[redacted]", deep: [{ cardMessage: "[redacted]", ok: "fine" }] },
      "set-cookie": "[redacted]",
      "x-api-key": "[redacted]",
      sessionToken: "[redacted]",
      PASSWORD: "[redacted]",
      contact: "[redacted]",
      count: 3,
    });
  });

  it("masks error messages, stacks, extra fields and causes", () => {
    const error = new Error("bad sara@example.com", { cause: new Error("phone +92 300 1234567") });
    Object.assign(error, { keyValue: { email: "sara@example.com" }, note: "ring 0300 1234567" });
    const text = JSON.stringify(maskValue(error));
    expect(text).not.toContain("sara@example.com");
    expect(text).not.toContain("1234567");
    expect(text).toContain("[email]");
  });

  it("does not mutate its input and survives cycles", () => {
    const input: Record<string, unknown> = { email: "a@b.co", note: "x@y.io" };
    input.self = input;
    const masked = maskValue(input) as Record<string, unknown>;
    expect(input.email).toBe("a@b.co");
    expect(masked.self).toBe("[circular]");
  });

  it("keeps the request id untouched", () => {
    expect(maskValue({ requestId: "1234567890123456" })).toEqual({ requestId: "1234567890123456" });
  });
});
