import { PublicTemplateSchema, type PublicTemplate } from "@giftpop/contracts";
import { describe, expect, it } from "vitest";

import {
  shareLabel,
  unavailableIds,
  categoryChips,
  categoryParam,
  filterByCategory,
  giftCountLabel,
  giftsHref,
  moreItemsLabel,
  orderLabel,
  sceneWidthPercent,
} from "./gifts-model";

import { formatMoney } from "@/lib/format-money";

const ID = "a".repeat(24);

function template(over: Record<string, unknown> = {}): PublicTemplate {
  return PublicTemplateSchema.parse({
    id: ID,
    title: "Birthday joy",
    description: "",
    shareId: "abcDEF12_-",
    country: "PK",
    currency: "PKR",
    design: {
      packagingId: ID,
      items: [],
      wrapperColor: "#ffd3e0",
      ribbonColor: "#e8336d",
      arrangementSeed: 1,
    },
    packaging: {
      id: ID,
      slug: "box",
      name: "Gift box",
      description: "",
      layoutType: "grid",
      minItems: 1,
      maxItems: 10,
      capacityUnits: 20,
      wrapperColors: [{ name: "Blush", hex: "#ffd3e0" }],
      ribbonColors: [{ name: "Pink", hex: "#e8336d" }],
      layers: {},
      active: true,
      sortOrder: 0,
    },
    items: [],
    category: { slug: "birthday", name: "Birthday" },
    featured: false,
    priceMinor: 450000,
    itemSummary: { names: [], moreCount: 0 },
    ...over,
  });
}

const birthday = { slug: "birthday", name: "Birthday" };
const getWell = { slug: "get-well", name: "Get well" };

describe("categoryChips", () => {
  it("is empty when no template has a category", () => {
    expect(categoryChips([template({ category: null })])).toEqual([]);
    expect(categoryChips([])).toEqual([]);
  });

  it("makes one chip per slug with a count, sorted by name", () => {
    const chips = categoryChips([
      template({ category: getWell }),
      template({ category: birthday }),
      template({ category: null }),
      template({ category: birthday }),
    ]);
    expect(chips).toEqual([
      { slug: "birthday", name: "Birthday", count: 2 },
      { slug: "get-well", name: "Get well", count: 1 },
    ]);
  });

  it("uses whatever categories staff typed, nothing is hard-coded", () => {
    const chips = categoryChips([template({ category: { slug: "eid", name: "Eid" } })]);
    expect(chips.map((chip) => chip.slug)).toEqual(["eid"]);
  });
});

describe("categoryParam", () => {
  it("normalises case and whitespace", () => {
    expect(categoryParam(" Get-Well ")).toBe("get-well");
  });

  it("is null when absent or blank", () => {
    expect(categoryParam(undefined)).toBeNull();
    expect(categoryParam("  ")).toBeNull();
    expect(categoryParam([])).toBeNull();
  });

  it("keeps the first of a repeated parameter", () => {
    expect(categoryParam(["birthday", "get-well"])).toBe("birthday");
  });
});

describe("filterByCategory", () => {
  const a = template({ title: "A", category: birthday });
  const b = template({ title: "B", category: getWell });
  const c = template({ title: "C", category: null });

  it("keeps everything, in order, for no slug", () => {
    expect(filterByCategory([a, b, c], null).map((t) => t.title)).toEqual(["A", "B", "C"]);
  });

  it("keeps only the matching category, never uncategorised gifts", () => {
    expect(filterByCategory([a, b, c], "birthday").map((t) => t.title)).toEqual(["A"]);
  });

  it("returns nothing for an unknown slug", () => {
    expect(filterByCategory([a, b, c], "nope")).toEqual([]);
  });
});

describe("giftsHref", () => {
  it("builds shareable lower-case addresses", () => {
    expect(giftsHref("PK")).toBe("/pk/gifts");
    expect(giftsHref("PK", "get-well")).toBe("/pk/gifts?category=get-well");
    expect(giftsHref("GB", null)).toBe("/gb/gifts");
  });
});

describe("moreItemsLabel", () => {
  it("shows how many names are left out", () => {
    expect(moreItemsLabel({ names: ["a", "b", "c", "d"], moreCount: 3 })).toBe("+3 more");
  });

  it("is null when every item is named", () => {
    expect(moreItemsLabel({ names: ["a"], moreCount: 0 })).toBeNull();
  });
});

describe("orderLabel", () => {
  it("begins with the visible button text", () => {
    expect(orderLabel("Birthday joy").startsWith("Order this gift")).toBe(true);
    expect(orderLabel("Birthday joy")).toBe("Order this gift: Birthday joy");
  });
});

describe("sceneWidthPercent", () => {
  it("fills a wide scene's width and shrinks a tall one", () => {
    expect(sceneWidthPercent({ width: 1000, height: 1000 })).toBe(100);
    expect(sceneWidthPercent({ width: 940, height: 550 })).toBe(100);
    expect(sceneWidthPercent({ width: 500, height: 1000 })).toBe(50);
  });

  it("falls back to full width for an empty box", () => {
    expect(sceneWidthPercent({ width: 0, height: 0 })).toBe(100);
  });
});

describe("giftCountLabel", () => {
  it("pluralises", () => {
    expect(giftCountLabel(1)).toBe("1 gift");
    expect(giftCountLabel(0)).toBe("0 gifts");
    expect(giftCountLabel(12)).toBe("12 gifts");
  });
});

describe("price display", () => {
  it("shows priceMinor in the country currency using ISO minor digits", () => {
    expect(formatMoney(450000, "PKR", "en")).toMatch(/4,500$/);
    expect(formatMoney(1250, "GBP", "en")).toBe("£12.50");
  });
});

describe("unavailableIds", () => {
  const ids = (...list: string[]) => list.map((id) => ({ id }));

  it("is empty when the fresh list still has every gift", () => {
    expect(unavailableIds(ids("a", "b"), ids("b", "a"))).toEqual([]);
  });

  it("lists the gifts the fresh list dropped, in page order", () => {
    expect(unavailableIds(ids("a", "b", "c"), ids("b"))).toEqual(["a", "c"]);
  });

  it("ignores gifts that are only in the fresh list", () => {
    expect(unavailableIds(ids("a"), ids("a", "new"))).toEqual([]);
  });

  it("marks everything when the fresh list is empty", () => {
    expect(unavailableIds(ids("a", "b"), [])).toEqual(["a", "b"]);
  });
});

describe("shareLabel", () => {
  it("begins with the visible text", () => {
    expect(shareLabel("Birthday box")).toBe("Share: Birthday box");
    expect(shareLabel("x").startsWith("Share")).toBe(true);
  });
});
