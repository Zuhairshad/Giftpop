import {
  DesignSchema,
  ObjectIdSchema,
  ShareIdSchema,
  TemplateCategorySchema,
  validateDesign,
  type CountryCatalog,
  type CountryPrice,
} from "@giftpop/contracts";
import { describe, expect, it } from "vitest";

import { COUNTRIES, ITEMS, ITEM_IDS, PACKAGINGS, PRICES, TEMPLATES } from "./index";

const CATEGORY_SLUGS = ["birthday", "anniversary", "graduation", "thank-you", "get-well"];
const liveCountries = COUNTRIES.filter((country) => country.status === "live");

/** What the API builds for one country: only rows that have a price there. */
function catalogFor(code: string): CountryCatalog {
  const country = COUNTRIES.find((c) => c.code === code);
  if (!country) throw new Error(`Unknown country ${code}`);
  const rows = PRICES.filter((p) => p.country === code);
  return {
    country: code,
    currency: country.currency,
    packagings: PACKAGINGS.flatMap((packaging) => {
      const row = rows.find((p) => p.kind === "packaging" && p.packagingId === packaging.id);
      return row ? [{ packaging, priceMinor: row.priceMinor, inStock: row.inStock }] : [];
    }),
    items: ITEMS.flatMap((item) => {
      const row = rows.find((p) => p.kind === "item" && p.itemId === item.id);
      return row ? [{ item, priceMinor: row.priceMinor, inStock: row.inStock }] : [];
    }),
  };
}

function priceRow(code: string, predicate: (p: CountryPrice) => boolean): CountryPrice | undefined {
  return PRICES.find((p) => p.country === code && predicate(p));
}

describe("seed templates", () => {
  it("has 12 to 16 templates", () => {
    expect(TEMPLATES.length).toBeGreaterThanOrEqual(12);
    expect(TEMPLATES.length).toBeLessThanOrEqual(16);
  });

  it("parse with the contract schemas", () => {
    for (const template of TEMPLATES) {
      expect(ObjectIdSchema.safeParse(template.id).success).toBe(true);
      expect(ShareIdSchema.safeParse(template.shareId).success).toBe(true);
      expect(DesignSchema.safeParse(template.design).success).toBe(true);
      if (template.category) {
        expect(TemplateCategorySchema.safeParse(template.category).success).toBe(true);
      }
      expect(template.title.trim().length).toBeGreaterThan(0);
      expect(template.title.length).toBeLessThanOrEqual(80);
      expect(template.description.length).toBeGreaterThan(0);
      expect(template.description.length).toBeLessThanOrEqual(300);
      expect(Number.isInteger(template.sortOrder)).toBe(true);
    }
  });

  it("have unique ids, share ids and titles, and ids clear of every other seeded id", () => {
    const ids = TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(TEMPLATES.map((t) => t.shareId)).size).toBe(TEMPLATES.length);
    expect(new Set(TEMPLATES.map((t) => t.title)).size).toBe(TEMPLATES.length);
    const others = new Set<string>([...PACKAGINGS.map((p) => p.id), ...Object.values(ITEM_IDS)]);
    for (const id of ids) expect(others.has(id)).toBe(false);
  });

  it("use exactly the five opening categories, each with at least two gifts", () => {
    const slugs = new Set(TEMPLATES.map((t) => t.category?.slug));
    expect([...slugs].sort()).toEqual([...CATEGORY_SLUGS].sort());
    for (const slug of CATEGORY_SLUGS) {
      expect(TEMPLATES.filter((t) => t.category?.slug === slug).length).toBeGreaterThanOrEqual(2);
    }
    // One slug never carries two different names.
    const names = new Map<string, string>();
    for (const t of TEMPLATES) {
      if (!t.category) continue;
      expect(names.get(t.category.slug) ?? t.category.name).toBe(t.category.name);
      names.set(t.category.slug, t.category.name);
    }
  });

  it("feature a few gifts, not all of them", () => {
    const featured = TEMPLATES.filter((t) => t.featured).length;
    expect(featured).toBeGreaterThanOrEqual(2);
    expect(featured).toBeLessThan(TEMPLATES.length / 2);
  });

  it("spread across the seeded formats", () => {
    const used = new Set(TEMPLATES.map((t) => t.design.packagingId));
    for (const packaging of PACKAGINGS) expect(used.has(packaging.id)).toBe(true);
  });

  it("use only the colours the packaging offers", () => {
    for (const template of TEMPLATES) {
      const packaging = PACKAGINGS.find((p) => p.id === template.design.packagingId);
      expect(packaging).toBeDefined();
      expect(packaging?.wrapperColors.map((c) => c.hex)).toContain(template.design.wrapperColor);
      expect(packaging?.ribbonColors.map((c) => c.hex)).toContain(template.design.ribbonColor);
    }
  });

  it("number item slots 0, 1, 2, ... and give every gift a different arrangement seed", () => {
    for (const template of TEMPLATES) {
      expect(template.design.items.map((line) => line.slot)).toEqual(
        template.design.items.map((_, index) => index),
      );
    }
    expect(new Set(TEMPLATES.map((t) => t.design.arrangementSeed)).size).toBe(TEMPLATES.length);
  });

  it("leave every text field empty for the customer to fill at checkout", () => {
    for (const template of TEMPLATES) {
      expect(template.design.personalisation).toEqual({
        cardMessage: "",
        recipientName: "",
        customRequest: "",
        itemNames: {},
      });
    }
  });

  it("are listed in live countries only, each at least once", () => {
    const live = new Set(liveCountries.map((c) => c.code));
    for (const template of TEMPLATES) {
      expect(template.countries.length).toBeGreaterThan(0);
      expect(new Set(template.countries).size).toBe(template.countries.length);
      for (const code of template.countries) expect(live.has(code)).toBe(true);
    }
  });

  it("are sellable in every country they list: priced, in stock, within min, max and capacity", () => {
    for (const template of TEMPLATES) {
      for (const code of template.countries) {
        const problems = validateDesign(template.design, catalogFor(code));
        expect(problems, `${template.title} in ${code}`).toEqual([]);
      }
    }
  });

  it("only use priced, in-stock items and packagings in each listed country", () => {
    for (const template of TEMPLATES) {
      for (const code of template.countries) {
        const packagingRow = priceRow(
          code,
          (p) => p.kind === "packaging" && p.packagingId === template.design.packagingId,
        );
        expect(packagingRow?.inStock, `${template.title} packaging in ${code}`).toBe(true);
        for (const line of template.design.items) {
          const row = priceRow(code, (p) => p.kind === "item" && p.itemId === line.itemId);
          expect(row?.priceMinor, `${template.title} price in ${code}`).toBeGreaterThan(0);
          expect(row?.inStock, `${template.title} stock in ${code}`).toBe(true);
        }
      }
    }
  });
});
