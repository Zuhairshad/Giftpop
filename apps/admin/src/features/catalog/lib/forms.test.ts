import {
  CountrySchema,
  DesignSchema,
  ItemSchema,
  PackagingSchema,
  SaveItemRequestSchema,
  SavePackagingRequestSchema,
} from "@giftpop/contracts";
import type { Country, Item, Packaging } from "@giftpop/contracts";
import { expandDesignItems } from "@giftpop/renderer";
import { describe, expect, it } from "vitest";

import {
  emptyCountryValues,
  flagEmoji,
  inputToMinor,
  minorToInput,
  toggleMode,
  toUpdateCountryRequest,
} from "./country-form";
import { buildSaveItemRequest, emptyItemValues, itemToFormValues } from "./item-form";
import {
  buildSavePackagingRequest,
  emptyPackagingValues,
  layoutOptions,
  packagingToFormValues,
  slugify,
} from "./packaging-form";
import {
  buildItemPreview,
  buildPackagingPreview,
  canPreviewLayout,
  previewId,
  safeColour,
} from "./scene-preview";

const image = { url: "https://cdn.test/a.webp", width: 400, height: 800, anchor: { x: 0.5, y: 1 } };

const item: Item = {
  id: "a".repeat(24),
  name: "Dark chocolate",
  category: "chocolates",
  shape: "bar",
  color: "#4b2e1e",
  sizeUnits: 2,
  personalizable: true,
  personalizationMaxLength: 12,
  image,
  active: true,
  sortOrder: 3,
};

const packaging: Packaging = {
  id: "b".repeat(24),
  slug: "classic-bouquet",
  name: "Classic bouquet",
  description: "",
  kind: "box",
  layoutType: "bouquet-fan",
  minItems: 6,
  maxItems: 10,
  capacityUnits: 20,
  wrapperColors: [{ name: "Kraft", hex: "#c8a27a" }],
  ribbonColors: [{ name: "Red", hex: "#c0392b" }],
  layers: { back: image },
  active: true,
  sortOrder: 0,
};

describe("item form mapping", () => {
  it("round-trips an item through form values to a valid request", () => {
    const values = SaveItemRequestSchema.parse(itemToFormValues(item));
    const request = buildSaveItemRequest(values, image);
    expect(request).toMatchObject({ name: "Dark chocolate", image, personalizationMaxLength: 12 });
    expect(request).not.toHaveProperty("id");
    expect(ItemSchema.safeParse({ id: item.id, ...request }).success).toBe(true);
  });

  it("drops the name limit when the item is not personalizable", () => {
    const values = SaveItemRequestSchema.parse({
      ...itemToFormValues(item),
      personalizable: false,
    });
    expect(buildSaveItemRequest(values, undefined)).not.toHaveProperty("personalizationMaxLength");
  });

  it("an empty form fails the contract until it is filled in", () => {
    expect(SaveItemRequestSchema.safeParse(emptyItemValues()).success).toBe(false);
    expect(
      SaveItemRequestSchema.safeParse({ ...emptyItemValues(), name: "Mug", category: "care" })
        .success,
    ).toBe(true);
  });

  it("requires a name limit on a personalizable item", () => {
    const result = SaveItemRequestSchema.safeParse({
      ...emptyItemValues(),
      name: "Mug",
      category: "care",
      personalizable: true,
    });
    expect(result.success).toBe(false);
  });
});

describe("packaging form mapping", () => {
  it("round-trips a packaging to a valid request", () => {
    const values = SavePackagingRequestSchema.parse({
      ...packagingToFormValues(packaging),
      layers: {},
    });
    const request = buildSavePackagingRequest(values, { back: image });
    expect(request.layers).toEqual({ back: image });
    expect(PackagingSchema.safeParse({ id: packaging.id, ...request }).success).toBe(true);
  });

  it("rejects min above max through the contract", () => {
    const result = SavePackagingRequestSchema.safeParse({
      ...packagingToFormValues(packaging),
      minItems: 12,
    });
    expect(result.success).toBe(false);
  });

  it("starts from a registered layout type", () => {
    expect(canPreviewLayout(emptyPackagingValues().layoutType)).toBe(true);
  });

  it("keeps a saved layout type the registry does not know", () => {
    const options = layoutOptions("mystery-layout");
    expect(options.at(-1)).toEqual({ value: "mystery-layout", known: false });
    expect(options.some((option) => option.known)).toBe(true);
    expect(layoutOptions("bouquet-fan").every((option) => option.known)).toBe(true);
  });

  it("slugifies names", () => {
    expect(slugify("Classic Bouquet!")).toBe("classic-bouquet");
    expect(slugify("  Café  Box 2 ")).toBe("cafe-box-2");
    expect(slugify("---")).toBe("");
  });
});

describe("country form mapping", () => {
  const country: Country = {
    code: "PK",
    name: "Pakistan",
    currency: "PKR",
    status: "live",
    paymentModes: ["prepaid", "cod"],
    shipping: { flatMinor: 25000, freeOverMinor: 500000, deliveryDays: { min: 2, max: 5 } },
    addressFormat: {
      region: { required: true, label: "Province" },
      postalCode: { required: false, label: "Postcode" },
    },
    paymentInstructions: "Send to account 123",
  };

  it("builds an update request without the code", () => {
    const request = toUpdateCountryRequest(country);
    expect(request).not.toHaveProperty("code");
    expect(request.shipping).toEqual(country.shipping);
  });

  it("an empty create form fails until code, name and currency are given", () => {
    expect(CountrySchema.safeParse(emptyCountryValues()).success).toBe(false);
    expect(
      CountrySchema.safeParse({
        ...emptyCountryValues(),
        code: "NZ",
        name: "New Zealand",
        currency: "NZD",
      }).success,
    ).toBe(true);
  });

  it("rejects delivery days with min above max", () => {
    const bad = { ...country, shipping: { ...country.shipping, deliveryDays: { min: 6, max: 2 } } };
    expect(CountrySchema.safeParse(bad).success).toBe(false);
  });

  it("converts money inputs to integer minor units, empty or invalid aside", () => {
    expect(inputToMinor("250", "PKR")).toBe(25000);
    expect(inputToMinor("", "PKR")).toBeUndefined();
    expect(inputToMinor("abc", "PKR")).toBeNaN();
    expect(minorToInput(25000, "PKR")).toBe("250.00");
    expect(minorToInput(undefined, "PKR")).toBe("");
    // The currency's own minor unit: yen have none, so 250 is 250.
    expect(inputToMinor("250", "JPY")).toBe(250);
    expect(minorToInput(250, "JPY")).toBe("250");
  });

  it("toggles payment modes without duplicates", () => {
    expect(toggleMode(["prepaid"], "cod", true)).toEqual(["prepaid", "cod"]);
    expect(toggleMode(["prepaid", "cod"], "cod", true)).toEqual(["prepaid", "cod"]);
    expect(toggleMode(["prepaid", "cod"], "prepaid", false)).toEqual(["cod"]);
  });

  it("makes a flag emoji from a code", () => {
    expect(flagEmoji("PK")).toBe("\u{1F1F5}\u{1F1F0}");
    expect(flagEmoji("gb")).toBe("\u{1F1EC}\u{1F1E7}");
    expect(flagEmoji("X")).toBe("\u{1F310}");
  });
});

describe("scene preview", () => {
  it("previews copies of one item with a valid design", () => {
    const scene = buildItemPreview(
      { name: "Bar", shape: "bar", color: "#333333", image },
      "box-grid",
      5,
    );
    expect(DesignSchema.safeParse(scene.design).success).toBe(true);
    expect(expandDesignItems(scene.design)).toHaveLength(5);
    expect(scene.items[0]?.image).toEqual(image);
  });

  it("caps copies and survives a bad count", () => {
    expect(expandDesignItems(buildItemPreview(item, "box-grid", 500).design)).toHaveLength(20);
    expect(expandDesignItems(buildItemPreview(item, "box-grid", Number.NaN).design)).toHaveLength(
      1,
    );
  });

  it("previews a packaging with sample items between min and max", () => {
    const scene = buildPackagingPreview({
      name: "Box",
      layoutType: "box-grid",
      minItems: 4,
      maxItems: 9,
    });
    expect(DesignSchema.safeParse(scene.design).success).toBe(true);
    expect(expandDesignItems(scene.design)).toHaveLength(7);
    expect(new Set(scene.items.map((sample) => sample.id)).size).toBe(scene.items.length);
  });

  it("survives half-typed form values", () => {
    const scene = buildPackagingPreview({
      name: "",
      layoutType: "box-grid",
      minItems: Number.NaN,
      maxItems: 0,
      wrapperColor: "#zz",
    });
    expect(expandDesignItems(scene.design).length).toBeGreaterThan(0);
    expect(scene.packaging.wrapperColors[0]?.hex).toBe("#c8a27a");
  });

  it("makes valid ids and falls back on bad colours", () => {
    expect(previewId(1)).toMatch(/^[a-f\d]{24}$/);
    expect(safeColour("#fff")).toBe("#fff");
    expect(safeColour("red")).toBe("#cccccc");
    expect(safeColour(undefined, "#111111")).toBe("#111111");
  });
});
