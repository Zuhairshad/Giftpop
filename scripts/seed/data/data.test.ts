import {
  CountrySchema,
  LAUNCH_COUNTRY_CODES,
  ObjectIdSchema,
  PackagingSchema,
} from "@giftpop/contracts";
import { describe, expect, it } from "vitest";

import { BOUQUET_ID, BOX_ID, COUNTRIES, PACKAGINGS } from "./index";

describe("countries", () => {
  it("parse with the contract schema", () => {
    for (const country of COUNTRIES) expect(CountrySchema.safeParse(country).success).toBe(true);
  });

  it("are exactly the nine launch countries, all live and ask 20% now with cash on delivery", () => {
    expect(COUNTRIES.map((country) => country.code).sort()).toEqual(
      [...LAUNCH_COUNTRY_CODES].sort(),
    );
    for (const country of COUNTRIES) {
      expect(country.status).toBe("live");
      expect(country.paymentModes).toEqual(["cod"]);
    }
  });

  it("use the documented currencies", () => {
    const currencies = Object.fromEntries(COUNTRIES.map((c) => [c.code, c.currency]));
    expect(currencies).toEqual({
      US: "USD",
      GB: "GBP",
      SA: "SAR",
      IN: "INR",
      PK: "PKR",
      CN: "CNY",
      AU: "AUD",
      TR: "TRY",
      CA: "CAD",
    });
  });

  it("use the documented address formats", () => {
    const format = (code: string) => COUNTRIES.find((c) => c.code === code)?.addressFormat;
    expect(format("US")).toEqual({
      region: { required: true, label: "State" },
      postalCode: { required: true, label: "ZIP" },
    });
    expect(format("GB")).toEqual({
      region: { required: false, label: "County" },
      postalCode: { required: true, label: "Postcode" },
    });
    expect(format("CA")?.region.label).toBe("Province");
    expect(format("AU")?.postalCode.label).toBe("Postcode");
    expect(format("IN")?.postalCode.label).toBe("PIN code");
    expect(format("PK")?.postalCode).toEqual({ required: false, label: "Postal code" });
    expect(format("SA")?.region.label).toBe("Region");
    expect(format("TR")?.region.label).toBe("Province");
    expect(format("CN")?.region.label).toBe("Province");
  });

  it("give every country neutral payment instructions with a placeholder account", () => {
    for (const country of COUNTRIES) {
      const text = country.paymentInstructions;
      // Labelled lines, so the order page shows them as rows.
      expect(text).toContain("Account title: The Giftpop");
      expect(text).toContain("Account number: 0000 0000 0000");
      expect(text).not.toMatch(/DEV ONLY/i);
      // Only zeros: no digit sequence that could be a real account number.
      expect(text).not.toMatch(/[1-9]/);
    }
  });

  it("has a free-shipping threshold for SA and none for PK", () => {
    const find = (code: string) => COUNTRIES.find((c) => c.code === code);
    expect(find("SA")?.shipping.freeOverMinor).toBeGreaterThan(0);
    expect(find("PK")?.shipping.freeOverMinor).toBeUndefined();
  });
});

describe("packagings", () => {
  it("parse with the contract schema", () => {
    for (const packaging of PACKAGINGS) {
      expect(PackagingSchema.safeParse(packaging).success).toBe(true);
    }
  });

  it("have unique valid ids and slugs", () => {
    for (const packaging of PACKAGINGS)
      expect(ObjectIdSchema.safeParse(packaging.id).success).toBe(true);
    expect(new Set(PACKAGINGS.map((p) => p.id)).size).toBe(PACKAGINGS.length);
    expect(new Set(PACKAGINGS.map((p) => p.slug)).size).toBe(PACKAGINGS.length);
  });

  it("are a bouquet-fan bouquet (6 to 10) and a box-grid box (4 to 9)", () => {
    const bouquet = PACKAGINGS.find((p) => p.id === BOUQUET_ID);
    const box = PACKAGINGS.find((p) => p.id === BOX_ID);
    expect(bouquet).toMatchObject({ layoutType: "bouquet-fan", minItems: 6, maxItems: 10 });
    expect(box).toMatchObject({ layoutType: "box-grid", minItems: 4, maxItems: 9 });
    expect(PACKAGINGS.find((p) => p.slug === "round-hat-box")).toMatchObject({
      layoutType: "round-box",
    });
    expect(PACKAGINGS.find((p) => p.kind === "basket")).toMatchObject({ layoutType: "basket" });
    const layoutOf = (slug: string) => PACKAGINGS.find((p) => p.slug === slug)?.layoutType;
    expect(layoutOf("heart-box")).toBe("round-box");
    expect(layoutOf("framed-gift")).toBe("box-grid");
    expect(layoutOf("snack-hamper")).toBe("box-grid");
    expect(layoutOf("photo-bouquet")).toBe("bouquet-fan");
    expect(layoutOf("gift-tray")).toBe("basket");
    expect(PACKAGINGS.find((p) => p.kind === "mug")).toMatchObject({ layoutType: "mug-bouquet" });
  });

  it("group every packaging by kind", () => {
    const kinds = Object.fromEntries(PACKAGINGS.map((p) => [p.slug, p.kind]));
    expect(kinds).toEqual({
      bouquet: "bouquet",
      "gift-box": "box",
      "round-hat-box": "box",
      "gift-basket": "basket",
      "mug-bouquet": "mug",
      "heart-box": "box",
      "framed-gift": "box",
      "snack-hamper": "box",
      "photo-bouquet": "bouquet",
      "gift-tray": "basket",
    });
  });

  it("list pink as the first wrapper and ribbon accent colour", () => {
    for (const packaging of PACKAGINGS) {
      expect(packaging.wrapperColors.length).toBeGreaterThan(0);
      expect(packaging.ribbonColors.length).toBeGreaterThan(0);
      expect(packaging.wrapperColors[0]?.name.toLowerCase()).toContain("pink");
      expect(packaging.ribbonColors[0]?.name.toLowerCase()).toContain("pink");
    }
  });
});
