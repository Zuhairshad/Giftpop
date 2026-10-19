import {
  CatalogResponseSchema,
  PublicTemplateSchema,
  type CatalogResponse,
  type PublicTemplate,
} from "@giftpop/contracts";
import { describe, expect, it } from "vitest";

import {
  formatCards,
  formatStepHref,
  pickRangeCopy,
  sectionVisibility,
  startFromHref,
  templateCards,
} from "./view-models";

const ID_A = "a".repeat(24);
const ID_B = "b".repeat(24);

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
    ...over,
  });
}

function catalog(
  packagings: { priceMinor: number; inStock?: boolean; over?: Record<string, unknown> }[],
): CatalogResponse {
  return CatalogResponseSchema.parse({
    country: "PK",
    currency: "PKR",
    status: "live",
    categories: [],
    items: [],
    packagings: packagings.map((p, i) => ({
      packaging: packagingJson(i === 0 ? ID_A : ID_B, p.over),
      priceMinor: p.priceMinor,
      inStock: p.inStock ?? true,
    })),
  });
}

describe("links", () => {
  it("builds the from link and the format link in lower case", () => {
    expect(startFromHref("PK", "abcDEF12_-")).toBe("/pk/build/review?from=abcDEF12_-");
    expect(formatStepHref("PK")).toBe("/pk/build/format");
  });

  it("encodes the share id", () => {
    expect(startFromHref("GB", "a b")).toBe("/gb/build/review?from=a%20b");
  });
});

describe("pickRangeCopy", () => {
  it("says 'Pick 6 to 10' for a range and 'Pick 6' for one number", () => {
    expect(pickRangeCopy(6, 10)).toBe("Pick 6 to 10");
    expect(pickRangeCopy(6, 6)).toBe("Pick 6");
  });
});

describe("templateCards", () => {
  it("links to the review step and carries no price", () => {
    const [card] = templateCards([template("PK")], "PK");
    expect(card?.href).toBe("/pk/build/review?from=abcDEF12_-");
    expect(card?.title).toBe("Birthday joy");
    expect(Object.keys(card ?? {}).join(",")).not.toMatch(/price|quote|currency/i);
  });

  it("drops templates for another country", () => {
    expect(templateCards([template("US")], "PK")).toEqual([]);
  });
});

describe("formatCards", () => {
  it("shows the catalog price in the catalog currency", () => {
    const [card] = formatCards(catalog([{ priceMinor: 250000 }]), "PK");
    expect(card?.pickCopy).toBe("Pick 6 to 10");
    expect(card?.priceCopy).toContain("2,500");
    expect(card?.href).toBe("/pk/build/format");
  });

  it("skips inactive and out-of-stock packagings and sorts by sortOrder", () => {
    const cards = formatCards(
      catalog([
        { priceMinor: 100, over: { sortOrder: 5, name: "Late" } },
        { priceMinor: 100, over: { sortOrder: 1, name: "Early" } },
      ]),
      "PK",
    );
    expect(cards.map((c) => c.name)).toEqual(["Early", "Late"]);
    expect(formatCards(catalog([{ priceMinor: 1, inStock: false }]), "PK")).toEqual([]);
    expect(formatCards(catalog([{ priceMinor: 1, over: { active: false } }]), "PK")).toEqual([]);
  });
});

describe("sectionVisibility", () => {
  const someTemplates = templateCards([template("PK")], "PK");
  const someFormats = formatCards(catalog([{ priceMinor: 100 }]), "PK");

  it("without a country shows only the choose-country call to action", () => {
    expect(sectionVisibility({ country: undefined, templates: null, formats: null })).toEqual({
      chooseCountry: true,
      templates: false,
      formats: false,
    });
  });

  it("with a country shows templates and formats when present", () => {
    expect(
      sectionVisibility({ country: "PK", templates: someTemplates, formats: someFormats }),
    ).toEqual({ chooseCountry: false, templates: true, formats: true });
  });

  it("hides a section when its call failed (null) or came back empty", () => {
    expect(sectionVisibility({ country: "PK", templates: null, formats: someFormats })).toEqual({
      chooseCountry: false,
      templates: false,
      formats: true,
    });
    expect(sectionVisibility({ country: "PK", templates: [], formats: null })).toEqual({
      chooseCountry: false,
      templates: false,
      formats: false,
    });
  });
});
