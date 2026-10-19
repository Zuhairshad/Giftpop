import { describe, expect, it } from "vitest";

import { majorToMinor, minorToMajor } from "../src/index";

describe("majorToMinor (2-digit currency)", () => {
  it.each([
    ["12.50", 1250],
    ["12.5", 1250],
    ["12", 1200],
    ["0", 0],
    ["0.05", 5],
    [".5", 50],
    ["5.", 500],
    ["  7.99 ", 799],
    ["1,200.50", 120050],
    ["1,234,567", 123456700],
  ])("converts %s to %i", (input, expected) => {
    expect(majorToMinor(input, "USD")).toBe(expected);
  });

  it("rejects more than two decimals instead of rounding", () => {
    for (const input of ["12.345", "0.005", "0.004999", "1.005", "8.675", "99.995"]) {
      expect(majorToMinor(input, "USD")).toBeNull();
    }
  });

  it("keeps exactly two decimals without float drift", () => {
    expect(majorToMinor("12.34", "USD")).toBe(1234);
    expect(majorToMinor("1.01", "USD")).toBe(101);
    expect(majorToMinor("8.67", "USD")).toBe(867);
    expect(majorToMinor("0.29", "USD")).toBe(29);
    expect(majorToMinor("0.01", "USD")).toBe(1);
  });

  it.each(["", "  ", ".", "abc", "-5", "1.2.3", "1e3", "12,50", "1,23", "$5", "5 USD"])(
    "rejects %j",
    (input) => {
      expect(majorToMinor(input, "USD")).toBeNull();
    },
  );

  it("rejects amounts too large to be a safe integer", () => {
    expect(majorToMinor("99999999999999999999", "USD")).toBeNull();
  });

  it("always returns an integer", () => {
    for (const input of ["0.29", "1.15", "19.99", "4.35"]) {
      expect(Number.isInteger(majorToMinor(input, "USD"))).toBe(true);
    }
    expect(majorToMinor("0.29", "USD")).toBe(29);
    expect(majorToMinor("19.99", "USD")).toBe(1999);
    expect(majorToMinor("1.255", "USD")).toBeNull();
  });
});

describe("minorToMajor (2-digit currency)", () => {
  it.each([
    [1250, "12.50"],
    [5, "0.05"],
    [0, "0.00"],
    [100, "1.00"],
    [120050, "1200.50"],
    [-1250, "-12.50"],
  ])("shows %i as %s", (minor, expected) => {
    expect(minorToMajor(minor, "USD")).toBe(expected);
  });

  it("throws on a float", () => {
    expect(() => minorToMajor(12.5, "USD")).toThrow(RangeError);
  });

  it("round-trips with majorToMinor", () => {
    for (const minor of [0, 1, 99, 100, 101, 1999, 123456789]) {
      expect(majorToMinor(minorToMajor(minor, "USD"), "USD")).toBe(minor);
    }
  });
});

describe("other minor-unit sizes come from the currency (rule 7: a new country needs no code)", () => {
  it("JPY has no minor unit: 500 is 500, and decimals are refused", () => {
    expect(majorToMinor("500", "JPY")).toBe(500);
    expect(majorToMinor("1,500", "JPY")).toBe(1500);
    expect(majorToMinor("500.5", "JPY")).toBeNull();
    expect(minorToMajor(500, "JPY")).toBe("500");
  });

  it("KWD has three digits", () => {
    expect(majorToMinor("1.250", "KWD")).toBe(1250);
    expect(majorToMinor("1.2", "KWD")).toBe(1200);
    expect(majorToMinor("1.2345", "KWD")).toBeNull();
    expect(minorToMajor(1250, "KWD")).toBe("1.250");
  });

  it("round-trips for every size", () => {
    for (const currency of ["JPY", "USD", "PKR", "KWD"]) {
      for (const minor of [0, 1, 99, 1000, 123456]) {
        expect(majorToMinor(minorToMajor(minor, currency), currency)).toBe(minor);
      }
    }
  });
});
