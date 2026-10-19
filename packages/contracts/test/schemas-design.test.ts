import { describe, expect, it } from "vitest";

import { DesignSchema, ItemSchema, PackagingSchema } from "../src/index";

import { id, makeItem, makePackaging } from "./helpers";

function designInput(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    packagingId: id(1),
    items: [
      { itemId: id(101), qty: 1, slot: 0 },
      { itemId: id(102), qty: 2, slot: 1 },
    ],
    wrapperColor: "#fff",
    ribbonColor: "#ff0000",
    arrangementSeed: 42,
    ...overrides,
  };
}

function lines(count: number) {
  return Array.from({ length: count }, (_, i) => ({ itemId: id(200 + i), qty: 1, slot: i }));
}

describe("DesignSchema", () => {
  it("accepts a valid design and fills in empty personalisation", () => {
    const parsed = DesignSchema.parse(designInput());
    expect(parsed.personalisation).toEqual({ cardMessage: "", recipientName: "", itemNames: {} });
  });

  it("rejects duplicate slots", () => {
    const items = [
      { itemId: id(101), qty: 1, slot: 0 },
      { itemId: id(102), qty: 1, slot: 0 },
    ];
    expect(DesignSchema.safeParse(designInput({ items })).success).toBe(false);
  });

  it("rejects the same item on two lines", () => {
    const items = [
      { itemId: id(101), qty: 1, slot: 0 },
      { itemId: id(101), qty: 1, slot: 1 },
    ];
    expect(DesignSchema.safeParse(designInput({ items })).success).toBe(false);
  });

  it("allows 50 lines and rejects 51", () => {
    expect(DesignSchema.safeParse(designInput({ items: lines(50) })).success).toBe(true);
    expect(DesignSchema.safeParse(designInput({ items: lines(51) })).success).toBe(false);
  });

  it.each([0, 21, 1.5, -1])("rejects qty %s", (qty) => {
    const items = [{ itemId: id(101), qty, slot: 0 }];
    expect(DesignSchema.safeParse(designInput({ items })).success).toBe(false);
  });

  it("allows qty 1 and 20", () => {
    for (const qty of [1, 20]) {
      const items = [{ itemId: id(101), qty, slot: 0 }];
      expect(DesignSchema.safeParse(designInput({ items })).success).toBe(true);
    }
  });

  it.each([-1, 0.5])("rejects slot %s", (slot) => {
    const items = [{ itemId: id(101), qty: 1, slot }];
    expect(DesignSchema.safeParse(designInput({ items })).success).toBe(false);
  });

  it("limits arrangementSeed to an unsigned 32-bit integer", () => {
    for (const ok of [0, 4294967295]) {
      expect(DesignSchema.safeParse(designInput({ arrangementSeed: ok })).success).toBe(true);
    }
    for (const bad of [-1, 4294967296, 1.5]) {
      expect(DesignSchema.safeParse(designInput({ arrangementSeed: bad })).success).toBe(false);
    }
  });

  it("rejects bad colours and bad ids", () => {
    expect(DesignSchema.safeParse(designInput({ wrapperColor: "red" })).success).toBe(false);
    expect(DesignSchema.safeParse(designInput({ ribbonColor: "#12" })).success).toBe(false);
    expect(DesignSchema.safeParse(designInput({ packagingId: "abc" })).success).toBe(false);
    const items = [{ itemId: "not-an-id", qty: 1, slot: 0 }];
    expect(DesignSchema.safeParse(designInput({ items })).success).toBe(false);
  });

  it("enforces the personalisation limits (200, 40, 40)", () => {
    const personalisation = (p: Record<string, unknown>) =>
      designInput({ personalisation: { cardMessage: "", recipientName: "", itemNames: {}, ...p } });
    expect(DesignSchema.safeParse(personalisation({ cardMessage: "a".repeat(200) })).success).toBe(
      true,
    );
    expect(DesignSchema.safeParse(personalisation({ cardMessage: "a".repeat(201) })).success).toBe(
      false,
    );
    expect(DesignSchema.safeParse(personalisation({ recipientName: "a".repeat(40) })).success).toBe(
      true,
    );
    expect(DesignSchema.safeParse(personalisation({ recipientName: "a".repeat(41) })).success).toBe(
      false,
    );
    expect(
      DesignSchema.safeParse(personalisation({ itemNames: { [id(101)]: "a".repeat(40) } })).success,
    ).toBe(true);
    expect(
      DesignSchema.safeParse(personalisation({ itemNames: { [id(101)]: "a".repeat(41) } })).success,
    ).toBe(false);
    expect(
      DesignSchema.safeParse(personalisation({ itemNames: { "not-an-id": "x" } })).success,
    ).toBe(false);
  });
});

describe("PackagingSchema", () => {
  it("accepts a valid packaging", () => {
    expect(PackagingSchema.safeParse(makePackaging()).success).toBe(true);
  });

  it("rejects minItems above maxItems", () => {
    const result = PackagingSchema.safeParse(makePackaging({ minItems: 6, maxItems: 5 }));
    expect(result.success).toBe(false);
  });

  it("allows minItems equal to maxItems", () => {
    expect(PackagingSchema.safeParse(makePackaging({ minItems: 4, maxItems: 4 })).success).toBe(
      true,
    );
  });

  it.each([{ minItems: 0 }, { maxItems: 0 }, { capacityUnits: 0 }, { capacityUnits: 1.5 }])(
    "rejects %j",
    (override) => {
      expect(PackagingSchema.safeParse(makePackaging(override)).success).toBe(false);
    },
  );

  it("takes layoutType as a kebab-case name, so new layouts need no contract change", () => {
    for (const layoutType of ["grid", "bouquet", "fan-out", "grid-2"]) {
      expect(PackagingSchema.safeParse(makePackaging({ layoutType })).success).toBe(true);
    }
    for (const layoutType of ["Grid", "grid_x", "", " grid", "-grid"]) {
      expect(PackagingSchema.safeParse(makePackaging({ layoutType })).success).toBe(false);
    }
  });

  it("needs at least one wrapper colour and one ribbon colour", () => {
    expect(PackagingSchema.safeParse(makePackaging({ wrapperColors: [] })).success).toBe(false);
    expect(PackagingSchema.safeParse(makePackaging({ ribbonColors: [] })).success).toBe(false);
  });
});

describe("ItemSchema", () => {
  it("requires personalizationMaxLength when personalizable", () => {
    const result = ItemSchema.safeParse(makeItem(1, { personalizable: true }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("personalizationMaxLength"))).toBe(
        true,
      );
    }
  });

  it("accepts a personalizable item with a limit", () => {
    expect(
      ItemSchema.safeParse(makeItem(1, { personalizable: true, personalizationMaxLength: 12 }))
        .success,
    ).toBe(true);
  });

  it("does not need a limit when not personalizable", () => {
    expect(ItemSchema.safeParse(makeItem(1)).success).toBe(true);
  });

  it("keeps the per-item limit between 1 and 40", () => {
    for (const bad of [0, 41, 1.5]) {
      const item = makeItem(1, { personalizable: true, personalizationMaxLength: bad });
      expect(ItemSchema.safeParse(item).success).toBe(false);
    }
    const edge = makeItem(1, { personalizable: true, personalizationMaxLength: 40 });
    expect(ItemSchema.safeParse(edge).success).toBe(true);
  });

  it.each([{ sizeUnits: 0 }, { sizeUnits: 1.5 }, { color: "brown" }, { name: "" }])(
    "rejects %j",
    (override) => {
      expect(ItemSchema.safeParse(makeItem(1, override)).success).toBe(false);
    },
  );

  it("accepts every shape in the product list and rejects others", () => {
    const shapes = [
      "bar",
      "bottle",
      "jar",
      "box",
      "mug",
      "flower",
      "card",
      "soft-toy",
      "balloon",
      "other",
    ];
    for (const shape of shapes) {
      expect(ItemSchema.safeParse({ ...makeItem(1), shape }).success).toBe(true);
    }
    expect(ItemSchema.safeParse({ ...makeItem(1), shape: "teapot" }).success).toBe(false);
  });
});
