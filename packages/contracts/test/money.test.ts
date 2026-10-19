import { describe, expect, it } from "vitest";

import {
  CurrencyCodeSchema,
  MinorUnitsSchema,
  MoneySchema,
  addMoney,
  money,
  multiplyMoney,
  percentOfMinor,
  percentOfMoney,
  subtractMoney,
  sumMoney,
} from "../src/index";

import { usd } from "./helpers";

describe("money()", () => {
  it("builds integer minor-unit money", () => {
    expect(money(1999, "USD")).toEqual({ amountMinor: 1999, currency: "USD" });
    expect(money(0, "PKR")).toEqual({ amountMinor: 0, currency: "PKR" });
  });

  it.each([10.5, 0.1, Number.NaN, Number.POSITIVE_INFINITY, 2 ** 53])(
    "rejects non-integer or unsafe amount %s",
    (bad) => {
      expect(() => money(bad, "USD")).toThrow(RangeError);
    },
  );

  it("treats negative zero as zero (equal and serialised as 0)", () => {
    const zero = money(-0, "USD");
    expect(zero.amountMinor === 0).toBe(true);
    expect(JSON.stringify(zero)).toBe('{"amountMinor":0,"currency":"USD"}');
  });
});

describe("add / subtract / multiply / sum", () => {
  it("adds and subtracts in the same currency", () => {
    expect(addMoney(usd(150), usd(250))).toEqual(usd(400));
    expect(subtractMoney(usd(400), usd(150))).toEqual(usd(250));
  });

  it("refuses to mix currencies", () => {
    expect(() => addMoney(usd(1), money(1, "GBP"))).toThrow(RangeError);
    expect(() => subtractMoney(usd(1), money(1, "GBP"))).toThrow(RangeError);
  });

  it("subtracting equal amounts gives a plain zero", () => {
    expect(Object.is(subtractMoney(usd(5), usd(5)).amountMinor, 0)).toBe(true);
  });

  it("multiplies by an integer quantity", () => {
    expect(multiplyMoney(usd(333), 3)).toEqual(usd(999));
    expect(multiplyMoney(usd(333), 0)).toEqual(usd(0));
  });

  it("multiplying a negative amount by zero is zero, serialised as 0", () => {
    const zero = multiplyMoney(usd(-5), 0);
    expect(zero.amountMinor === 0).toBe(true);
    expect(JSON.stringify(zero)).toBe('{"amountMinor":0,"currency":"USD"}');
  });

  it.each([1.5, Number.NaN, Number.POSITIVE_INFINITY])("rejects quantity %s", (qty) => {
    expect(() => multiplyMoney(usd(100), qty)).toThrow(RangeError);
  });

  it("sums a list, and an empty list is zero in the named currency", () => {
    expect(sumMoney([usd(1), usd(2), usd(3)], "USD")).toEqual(usd(6));
    expect(sumMoney([], "GBP")).toEqual(money(0, "GBP"));
  });

  it("sum rejects a line in another currency", () => {
    expect(() => sumMoney([usd(1), money(1, "GBP")], "USD")).toThrow(RangeError);
    expect(() => sumMoney([usd(1)], "GBP")).toThrow(RangeError);
  });
});

describe("percentOfMinor", () => {
  it("handles 0% and 100%", () => {
    expect(percentOfMinor(12345, 0)).toBe(0);
    expect(percentOfMinor(12345, 100)).toBe(12345);
  });

  it("is exact when the result is whole", () => {
    expect(percentOfMinor(1000, 20)).toBe(200);
    expect(percentOfMinor(0, 20)).toBe(0);
  });

  it.each([
    [4, 10, 0], // 0.4
    [5, 10, 1], // 0.5 rounds up
    [6, 10, 1], // 0.6
    [15, 10, 2], // 1.5 rounds up
    [25, 10, 3], // 2.5 rounds up, not to even
    [1, 50, 1], // 0.5 rounds up
    [3, 50, 2], // 1.5 rounds up
    [1002, 20, 200], // 200.4
    [1003, 20, 201], // 200.6
    [2, 25, 1], // 0.5 rounds up
  ])("percentOfMinor(%i, %i%%) = %i (half up)", (amount, percent, expected) => {
    expect(percentOfMinor(amount, percent)).toBe(expected);
  });

  it("always returns an integer and never negative zero", () => {
    for (let amount = 0; amount < 200; amount += 1) {
      for (const percent of [0, 7, 20, 33, 50, 99, 100]) {
        const result = percentOfMinor(amount, percent);
        expect(Number.isInteger(result)).toBe(true);
        expect(Object.is(result, -0)).toBe(false);
      }
    }
  });

  it.each([-1, 101, 1.5, Number.NaN, Number.POSITIVE_INFINITY])("rejects percent %s", (percent) => {
    expect(() => percentOfMinor(100, percent)).toThrow(RangeError);
  });

  it.each([10.5, Number.NaN, 2 ** 53])("rejects amount %s", (amount) => {
    expect(() => percentOfMinor(amount, 20)).toThrow(RangeError);
  });

  it("percentOfMoney keeps the currency", () => {
    expect(percentOfMoney(money(1003, "PKR"), 20)).toEqual(money(201, "PKR"));
  });
});

describe("MoneySchema and friends", () => {
  it("accepts integer minor units with an ISO-style code", () => {
    expect(MoneySchema.parse({ amountMinor: 1999, currency: "USD" })).toEqual({
      amountMinor: 1999,
      currency: "USD",
    });
    expect(MoneySchema.safeParse({ amountMinor: 0, currency: "PKR" }).success).toBe(true);
  });

  it.each([10.5, Number.NaN, Number.POSITIVE_INFINITY, 2 ** 53, "100"])(
    "rejects amountMinor %s",
    (amountMinor) => {
      expect(MoneySchema.safeParse({ amountMinor, currency: "USD" }).success).toBe(false);
    },
  );

  it("rejects a missing field", () => {
    expect(MoneySchema.safeParse({ amountMinor: 100 }).success).toBe(false);
    expect(MoneySchema.safeParse({ currency: "USD" }).success).toBe(false);
  });

  it("accepts negative zero as an ordinary zero", () => {
    const parsed = MoneySchema.parse({ amountMinor: -0, currency: "USD" });
    expect(parsed.amountMinor === 0).toBe(true);
    expect(JSON.stringify(parsed)).toBe('{"amountMinor":0,"currency":"USD"}');
  });

  it.each(["usd", "US", "USDD", "", "U5D", "123", " USD", "USD "])(
    "rejects currency code %j",
    (code) => {
      expect(CurrencyCodeSchema.safeParse(code).success).toBe(false);
      expect(MoneySchema.safeParse({ amountMinor: 1, currency: code }).success).toBe(false);
    },
  );

  it.each(["USD", "GBP", "SAR", "INR", "PKR", "CNY", "AUD", "TRY", "CAD"])(
    "accepts launch currency %s",
    (code) => {
      expect(CurrencyCodeSchema.safeParse(code).success).toBe(true);
    },
  );

  it("MinorUnitsSchema is integer-only", () => {
    expect(MinorUnitsSchema.safeParse(5).success).toBe(true);
    expect(MinorUnitsSchema.safeParse(5.01).success).toBe(false);
  });
});
