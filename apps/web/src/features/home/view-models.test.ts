import { PublicTemplateSchema, type PublicTemplate } from "@giftpop/contracts";
import { describe, expect, it } from "vitest";

import { countryPath, giftsHrefFromBuild, giftsPath, templateCards } from "./view-models";

const ID_A = "a".repeat(24);

function packagingJson(id: string, over: Record<string, unknown> = {}) {
  return {
    id,
    slug: "box",
    name: "Gift box",
    description: "A sturdy box",
    layoutType: "grid",
    minItems: 6,
    maxItems: 10,
    capacityUnits: 20,
    wrapperColors: [{ name: "Blush", hex: "#ffd3e0" }],
    ribbonColors: [{ name: "Pink", hex: "#e8336d" }],
    layers: {},
    active: true,
    sortOrder: 0,
    ...over,
  };
}

function template(country: string, over: Record<string, unknown> = {}): PublicTemplate {
  return PublicTemplateSchema.parse({
    id: ID_A,
    title: "Birthday joy",
    description: "Sweet things",
    shareId: "abcDEF12_-",
    country,
    currency: "PKR",
    design: {
      packagingId: ID_A,
      items: [],
      wrapperColor: "#ffd3e0",
      ribbonColor: "#e8336d",
      arrangementSeed: 1,
    },
    packaging: packagingJson(ID_A),
    items: [],
    category: { slug: "birthday", name: "Birthday" },
    featured: false,
    priceMinor: 450000,
    itemSummary: { names: [], moreCount: 0 },
    ...over,
  });
}

describe("countryPath", () => {
  it("lower-cases the country code", () => {
    expect(countryPath("PK")).toBe("/pk");
  });
});

describe("templateCards", () => {
  it("links to the builder with the share id", () => {
    const [card] = templateCards([template("PK")], "PK");
    expect(card?.href).toBe("/pk/build?from=abcDEF12_-");
    expect(card?.title).toBe("Birthday joy");
  });

  it("carries the API's price and currency through unchanged", () => {
    const [card] = templateCards([template("PK", { priceMinor: 450050 })], "PK");
    expect(card?.priceMinor).toBe(450050);
    expect(card?.currency).toBe("PKR");
    const [free] = templateCards([template("PK", { priceMinor: 0, currency: "USD" })], "PK");
    expect(free?.priceMinor).toBe(0);
    expect(free?.currency).toBe("USD");
  });

  it("drops templates for another country", () => {
    expect(templateCards([template("US")], "PK")).toEqual([]);
  });
});

describe("giftsPath", () => {
  it("lower-cases the country code", () => {
    expect(giftsPath("PK")).toBe("/pk/gifts");
  });
});

describe("giftsHrefFromBuild", () => {
  it("maps a country's builder link to its catalog", () => {
    expect(giftsHrefFromBuild("/gb/build")).toBe("/gb/gifts");
  });

  it("is null before a country is chosen", () => {
    expect(giftsHrefFromBuild("/countries")).toBeNull();
    expect(giftsHrefFromBuild("/pk/build/review")).toBeNull();
  });
});
