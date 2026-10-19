import { describe, expect, it } from "vitest";

import {
  countryFromPath,
  parseCountryCookie,
  serializeCountryCookie,
  validCountryCode,
} from "./cookie";

describe("country cookie", () => {
  it("validates codes", () => {
    expect(validCountryCode("PK")).toBe("PK");
    expect(validCountryCode("pk")).toBeNull();
    expect(validCountryCode("PKR")).toBeNull();
    expect(validCountryCode("")).toBeNull();
    expect(validCountryCode(undefined)).toBeNull();
  });
  it("parses the cookie among others", () => {
    expect(parseCountryCookie("a=1; gp_country=GB; b=2")).toBe("GB");
    expect(parseCountryCookie("gp_country=GB")).toBe("GB");
  });
  it("ignores missing, invalid and look-alike cookies", () => {
    expect(parseCountryCookie(null)).toBeNull();
    expect(parseCountryCookie("a=1")).toBeNull();
    expect(parseCountryCookie("gp_country=pk")).toBeNull();
    expect(parseCountryCookie("gp_country=<script>")).toBeNull();
    expect(parseCountryCookie("xgp_country=GB")).toBeNull();
  });
  it("serialises with path, one year and SameSite=Lax", () => {
    expect(serializeCountryCookie("PK")).toBe(
      "gp_country=PK; Path=/; Max-Age=31536000; SameSite=Lax",
    );
  });
  it("refuses to serialise an invalid code", () => {
    expect(() => serializeCountryCookie("pk")).toThrow();
    expect(() => serializeCountryCookie("PK; Path=/x")).toThrow();
  });
  it("reads the country from the first path segment", () => {
    expect(countryFromPath("/pk")).toBe("PK");
    expect(countryFromPath("/gb/build/format")).toBe("GB");
    expect(countryFromPath("/")).toBeNull();
    expect(countryFromPath("/countries")).toBeNull();
    expect(countryFromPath("/track")).toBeNull();
  });
});
