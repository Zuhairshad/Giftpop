import { PublicTemplateSchema, type PublicTemplate } from "@giftpop/contracts";
import { describe, expect, it } from "vitest";

import { countryPath, templateCards } from "./view-models";

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
  it("links to the builder with the share id and carries no price", () => {
    const [card] = templateCards([template("PK")], "PK");
    expect(card?.href).toBe("/pk/build?from=abcDEF12_-");
    expect(card?.title).toBe("Birthday joy");
    expect(Object.keys(card ?? {}).join(",")).not.toMatch(/price|quote|currency/i);
  });

  it("drops templates for another country", () => {
    expect(templateCards([template("US")], "PK")).toEqual([]);
  });
});
