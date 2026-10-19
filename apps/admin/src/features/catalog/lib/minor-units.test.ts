import { describe, expect, it } from "vitest";

import { majorToMinor, minorToMajor } from "./minor-units";

describe("majorToMinor", () => {
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
    expect(majorToMinor(input)).toBe(expected);
  });

  it("rounds half up on the decimal string, with no float drift", () => {
    expect(majorToMinor("12.345")).toBe(1235);
    expect(majorToMinor("12.344")).toBe(1234);
    expect(majorToMinor("0.005")).toBe(1);
    expect(majorToMinor("0.004999")).toBe(0);
    expect(majorToMinor("1.005")).toBe(101);
    expect(majorToMinor("8.675")).toBe(868);
    expect(majorToMinor("0.285")).toBe(29);
    expect(majorToMinor("99.995")).toBe(10000);
  });

  it.each(["", "  ", ".", "abc", "-5", "1.2.3", "1e3", "12,50", "1,23", "$5", "5 USD"])(
    "rejects %j",
    (input) => {
      expect(majorToMinor(input)).toBeNull();
    },
  );

  it("rejects amounts too large to be a safe integer", () => {
    expect(majorToMinor("99999999999999999999")).toBeNull();
  });

  it("always returns an integer", () => {
    for (const input of ["0.29", "1.15", "19.99", "4.35", "1.255"]) {
      expect(Number.isInteger(majorToMinor(input))).toBe(true);
    }
    expect(majorToMinor("0.29")).toBe(29);
    expect(majorToMinor("19.99")).toBe(1999);
  });
});

describe("minorToMajor", () => {
  it.each([
    [1250, "12.50"],
    [5, "0.05"],
    [0, "0.00"],
    [100, "1.00"],
    [120050, "1200.50"],
    [-1250, "-12.50"],
  ])("shows %i as %s", (minor, expected) => {
    expect(minorToMajor(minor)).toBe(expected);
  });

  it("throws on a float", () => {
    expect(() => minorToMajor(12.5)).toThrow(RangeError);
  });

  it("round-trips with majorToMinor", () => {
    for (const minor of [0, 1, 99, 100, 101, 1999, 123456789]) {
      expect(majorToMinor(minorToMajor(minor))).toBe(minor);
    }
  });
});
