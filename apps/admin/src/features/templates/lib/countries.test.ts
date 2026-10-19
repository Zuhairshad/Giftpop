import type { Country } from "@giftpop/contracts";
import { describe, expect, it } from "vitest";

import { countryChoices, toggleCountry } from "./countries";

const country = (code: string, name: string, status: "live" | "coming_soon") =>
  ({ code, name, status }) as Country;

const all = [
  country("PK", "Pakistan", "live"),
  country("AE", "UAE", "live"),
  country("NG", "Nigeria", "coming_soon"),
];

describe("countryChoices", () => {
  it("lists live countries only", () => {
    expect(countryChoices(all, []).map((c) => c.code)).toEqual(["PK", "AE"]);
  });
  it("keeps a selected country that is no longer live, or unknown", () => {
    const choices = countryChoices(all, ["NG", "ZZ", "PK"]);
    expect(choices.map((c) => [c.code, c.name, c.live])).toEqual([
      ["PK", "Pakistan", true],
      ["AE", "UAE", true],
      ["NG", "Nigeria", false],
      ["ZZ", "ZZ", false],
    ]);
  });
});

describe("toggleCountry", () => {
  it("adds and removes in list order", () => {
    expect(toggleCountry(["AE"], "PK", true, ["PK", "AE"])).toEqual(["PK", "AE"]);
    expect(toggleCountry(["PK", "AE"], "PK", false, ["PK", "AE"])).toEqual(["AE"]);
    expect(toggleCountry([], "PK", false, ["PK"])).toEqual([]);
  });
});
