import { describe, expect, it } from "vitest";

import { DESIGN_PROBLEM_CODES, DesignProblemSchema, validateDesign } from "../src/index";
import type { DesignProblemCode } from "../src/index";

import {
  id,
  makeCatalog,
  makeDesign,
  makeItem,
  makePackaging,
  pricedItem,
  pricedPackaging,
} from "./helpers";

function codes(problems: readonly { code: DesignProblemCode }[]): DesignProblemCode[] {
  return problems.map((p) => p.code);
}

/** Roomy packaging so only the count rules are in play: 2 to 4 items, huge capacity. */
const roomy = makeCatalog({
  packagings: [pricedPackaging(makePackaging({ capacityUnits: 1000 }))],
});

describe("validateDesign: a valid design", () => {
  it("returns an empty list", () => {
    expect(validateDesign(makeDesign(), makeCatalog())).toEqual([]);
  });

  it("knows the nine problem codes", () => {
    expect([...DESIGN_PROBLEM_CODES].sort()).toEqual(
      [
        "ITEM_UNAVAILABLE",
        "OUT_OF_STOCK",
        "OVER_CAPACITY",
        "PACKAGING_UNAVAILABLE",
        "TEXT_INVALID",
        "TEXT_REQUIRED",
        "TEXT_TOO_LONG",
        "TOO_FEW_ITEMS",
        "TOO_MANY_ITEMS",
      ].sort(),
    );
  });
});

describe("validateDesign: item count (min 2, max 4)", () => {
  it("accepts exactly the minimum", () => {
    expect(validateDesign(makeDesign([{ n: 1 }, { n: 2 }]), roomy)).toEqual([]);
  });

  it("rejects one below the minimum", () => {
    expect(codes(validateDesign(makeDesign([{ n: 1 }]), roomy))).toEqual(["TOO_FEW_ITEMS"]);
  });

  it("rejects an empty design", () => {
    expect(codes(validateDesign(makeDesign([]), roomy))).toEqual(["TOO_FEW_ITEMS"]);
  });

  it("accepts exactly the maximum", () => {
    const lines = [{ n: 1 }, { n: 2 }, { n: 3 }, { n: 4 }];
    expect(validateDesign(makeDesign(lines), roomy)).toEqual([]);
  });

  it("rejects one above the maximum", () => {
    const lines = [{ n: 1 }, { n: 2 }, { n: 3 }, { n: 4 }, { n: 5 }];
    expect(codes(validateDesign(makeDesign(lines), roomy))).toEqual(["TOO_MANY_ITEMS"]);
  });

  it("counts qty toward the minimum", () => {
    expect(validateDesign(makeDesign([{ n: 1, qty: 2 }]), roomy)).toEqual([]);
  });

  it("counts qty toward the maximum", () => {
    expect(
      validateDesign(
        makeDesign([
          { n: 1, qty: 2 },
          { n: 2, qty: 2 },
        ]),
        roomy,
      ),
    ).toEqual([]);
    expect(
      codes(
        validateDesign(
          makeDesign([
            { n: 1, qty: 3 },
            { n: 2, qty: 2 },
          ]),
          roomy,
        ),
      ),
    ).toEqual(["TOO_MANY_ITEMS"]);
    expect(codes(validateDesign(makeDesign([{ n: 1, qty: 5 }]), roomy))).toEqual([
      "TOO_MANY_ITEMS",
    ]);
  });
});

describe("validateDesign: capacity (8 units, items are 2 each)", () => {
  it("accepts exactly the capacity", () => {
    const lines = [{ n: 1 }, { n: 2 }, { n: 3 }, { n: 4 }]; // 4 x 2 = 8
    expect(validateDesign(makeDesign(lines), makeCatalog())).toEqual([]);
  });

  it("rejects one unit over", () => {
    const catalog = makeCatalog({
      items: [
        pricedItem(makeItem(1, { sizeUnits: 3 })),
        pricedItem(makeItem(2, { sizeUnits: 3 })),
        pricedItem(makeItem(3, { sizeUnits: 3 })),
      ],
    });
    const problems = validateDesign(makeDesign([{ n: 1 }, { n: 2 }, { n: 3 }]), catalog); // 9 > 8
    expect(codes(problems)).toEqual(["OVER_CAPACITY"]);
  });

  it("accepts a design that is exactly full with larger items", () => {
    const catalog = makeCatalog({
      items: [pricedItem(makeItem(1, { sizeUnits: 4 })), pricedItem(makeItem(2, { sizeUnits: 4 }))],
    });
    expect(validateDesign(makeDesign([{ n: 1 }, { n: 2 }]), catalog)).toEqual([]);
  });

  it("multiplies sizeUnits by qty", () => {
    const catalog = makeCatalog({ items: [pricedItem(makeItem(1, { sizeUnits: 3 }))] });
    expect(validateDesign(makeDesign([{ n: 1, qty: 2 }]), catalog)).toEqual([]); // 6
    const problems = validateDesign(makeDesign([{ n: 1, qty: 3 }]), catalog); // 9 > 8
    expect(codes(problems)).toEqual(["OVER_CAPACITY"]);
  });
});

describe("validateDesign: availability", () => {
  it("flags an item the country does not sell", () => {
    const design = makeDesign([{ n: 1 }, { n: 99 }]);
    const problems = validateDesign(design, makeCatalog());
    expect(codes(problems)).toEqual(["ITEM_UNAVAILABLE"]);
    expect(problems[0]?.itemId).toBe(id(199));
  });

  it("flags an inactive item", () => {
    const catalog = makeCatalog({
      items: [pricedItem(makeItem(1)), pricedItem(makeItem(2, { active: false }))],
    });
    const problems = validateDesign(makeDesign([{ n: 1 }, { n: 2 }]), catalog);
    expect(codes(problems)).toEqual(["ITEM_UNAVAILABLE"]);
    expect(problems[0]?.itemId).toBe(id(102));
  });

  it("flags an out-of-stock item", () => {
    const catalog = makeCatalog({
      items: [pricedItem(makeItem(1)), pricedItem(makeItem(2), { inStock: false })],
    });
    const problems = validateDesign(makeDesign([{ n: 1 }, { n: 2 }]), catalog);
    expect(codes(problems)).toEqual(["OUT_OF_STOCK"]);
    expect(problems[0]?.itemId).toBe(id(102));
  });

  it("flags a packaging that is not sold in the country, and stops there", () => {
    const catalog = makeCatalog({ packagings: [] });
    expect(codes(validateDesign(makeDesign(), catalog))).toEqual(["PACKAGING_UNAVAILABLE"]);
    const other = makeDesign([{ n: 1 }], { packagingId: id(555) });
    expect(codes(validateDesign(other, makeCatalog()))).toEqual(["PACKAGING_UNAVAILABLE"]);
  });

  it("flags an inactive packaging", () => {
    const catalog = makeCatalog({
      packagings: [pricedPackaging(makePackaging({ active: false }))],
    });
    expect(codes(validateDesign(makeDesign(), catalog))).toEqual(["PACKAGING_UNAVAILABLE"]);
  });

  it("flags an out-of-stock packaging", () => {
    const catalog = makeCatalog({
      packagings: [pricedPackaging(makePackaging(), { inStock: false })],
    });
    expect(codes(validateDesign(makeDesign(), catalog))).toEqual(["OUT_OF_STOCK"]);
  });
});

describe("validateDesign: several problems at once", () => {
  it("reports every problem, not just the first", () => {
    const catalog = makeCatalog({
      items: [pricedItem(makeItem(1), { inStock: false }), pricedItem(makeItem(2))],
    });
    const design = makeDesign([{ n: 1 }, { n: 99 }], {
      personalisation: {
        cardMessage: "a".repeat(201),
        recipientName: "n".repeat(41),
        customRequest: "",
        itemNames: {},
      },
    });
    const found = codes(validateDesign(design, catalog));
    expect(found).toContain("OUT_OF_STOCK");
    expect(found).toContain("ITEM_UNAVAILABLE");
    expect(found.filter((code) => code === "TEXT_TOO_LONG")).toHaveLength(2);
  });

  it("reports too many items and over capacity together", () => {
    const lines = [{ n: 1 }, { n: 2 }, { n: 3 }, { n: 4 }, { n: 5 }]; // 5 items, 10 units
    expect(codes(validateDesign(makeDesign(lines), makeCatalog())).sort()).toEqual([
      "OVER_CAPACITY",
      "TOO_MANY_ITEMS",
    ]);
  });

  it("every problem matches DesignProblemSchema", () => {
    const design = makeDesign([{ n: 99 }], {
      personalisation: {
        cardMessage: "a".repeat(201),
        recipientName: "",
        customRequest: "",
        itemNames: {},
      },
    });
    const problems = validateDesign(design, makeCatalog());
    expect(problems.length).toBeGreaterThan(1);
    for (const problem of problems) {
      expect(DesignProblemSchema.safeParse(problem).success).toBe(true);
      expect(problem.message.length).toBeGreaterThan(0);
    }
  });
});
