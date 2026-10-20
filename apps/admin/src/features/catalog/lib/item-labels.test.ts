import {
  ITEM_PICKER_STYLES,
  ITEM_SHAPES,
  ItemSchema,
  SaveItemRequestSchema,
} from "@giftpop/contracts";
import type { Item } from "@giftpop/contracts";
import { describe, expect, it } from "vitest";

import { buildSaveItemRequest, emptyItemValues, itemToFormValues } from "./item-form";
import {
  DEFAULT_PICKER_STYLE,
  PICKER_STYLE_OPTIONS,
  SHAPE_OPTIONS,
  parsePickerStyle,
  pickerStyleBadge,
  resolvePickerStyle,
  shapeLabel,
} from "./item-labels";

const item: Item = {
  id: "c".repeat(24),
  name: "Rose candle",
  category: "candles",
  shape: "candle",
  color: "#e8b4b8",
  sizeUnits: 1,
  personalizable: false,
  pickerStyle: "list",
  active: true,
  sortOrder: 0,
};

describe("shape labels", () => {
  it("offers every contract shape once, in contract order", () => {
    expect(SHAPE_OPTIONS.map((option) => option.value)).toEqual([...ITEM_SHAPES]);
  });

  it("gives the six new shapes plain names", () => {
    expect(shapeLabel("perfume")).toBe("Perfume");
    expect(shapeLabel("candle")).toBe("Candle");
    expect(shapeLabel("jewellery")).toBe("Jewellery");
    expect(shapeLabel("cosmetic")).toBe("Cosmetic");
    expect(shapeLabel("cupcake")).toBe("Cupcake");
    expect(shapeLabel("frame")).toBe("Photo frame");
  });

  it("keeps the older names readable", () => {
    expect(shapeLabel("soft-toy")).toBe("Soft toy");
    expect(shapeLabel("other")).toBe("Other");
  });

  it("has a distinct, non-empty label for each shape", () => {
    const labels = SHAPE_OPTIONS.map((option) => option.label);
    expect(new Set(labels).size).toBe(labels.length);
    for (const label of labels) expect(label.trim()).not.toBe("");
  });
});

describe("picker style", () => {
  it("offers both styles, picture first, with the agreed wording", () => {
    expect(PICKER_STYLE_OPTIONS.map((option) => option.value)).toEqual([...ITEM_PICKER_STYLES]);
    expect(PICKER_STYLE_OPTIONS.map((option) => option.label)).toEqual([
      "Show with a picture (item grid)",
      "Show in the written list (name and price)",
    ]);
  });

  it("defaults to tile", () => {
    expect(DEFAULT_PICKER_STYLE).toBe("tile");
    expect(resolvePickerStyle(undefined)).toBe("tile");
    expect(resolvePickerStyle("list")).toBe("list");
  });

  it("badges only written-list items", () => {
    expect(pickerStyleBadge("list")).toBe("Written list");
    expect(pickerStyleBadge("tile")).toBeNull();
    expect(pickerStyleBadge(undefined)).toBeNull();
  });

  it("narrows a radio value and falls back to tile for anything else", () => {
    expect(parsePickerStyle("list")).toBe("list");
    expect(parsePickerStyle("tile")).toBe("tile");
    expect(parsePickerStyle("List")).toBe("tile");
    expect(parsePickerStyle("")).toBe("tile");
  });
});

describe("item form picker style", () => {
  it("starts a new item as a picture tile", () => {
    expect(emptyItemValues().pickerStyle).toBe("tile");
  });

  it("loads the saved style into the form", () => {
    expect(itemToFormValues(item).pickerStyle).toBe("list");
  });

  it("loads an item saved without a style as tile", () => {
    const { pickerStyle, ...legacy } = item;
    void pickerStyle;
    expect(itemToFormValues(legacy).pickerStyle).toBe("tile");
  });

  it("sends the chosen style in the save request", () => {
    const values = SaveItemRequestSchema.parse(itemToFormValues(item));
    const request = buildSaveItemRequest(values, undefined);
    expect(request.pickerStyle).toBe("list");
    expect(ItemSchema.safeParse({ id: item.id, ...request }).success).toBe(true);
  });

  it("sends tile when the values carry no style", () => {
    const { pickerStyle, ...values } = SaveItemRequestSchema.parse(itemToFormValues(item));
    void pickerStyle;
    expect(buildSaveItemRequest(values, undefined).pickerStyle).toBe("tile");
  });

  it("accepts a new shape with a written-list style end to end", () => {
    const values = SaveItemRequestSchema.parse({
      ...emptyItemValues(),
      name: "Silver locket",
      category: "jewellery",
      shape: "jewellery",
      pickerStyle: "list",
    });
    expect(buildSaveItemRequest(values, undefined)).toMatchObject({
      shape: "jewellery",
      pickerStyle: "list",
    });
  });

  it("rejects an unknown style at the form schema", () => {
    const result = SaveItemRequestSchema.safeParse({
      ...emptyItemValues(),
      name: "x",
      category: "y",
      pickerStyle: "grid",
    });
    expect(result.success).toBe(false);
  });
});
