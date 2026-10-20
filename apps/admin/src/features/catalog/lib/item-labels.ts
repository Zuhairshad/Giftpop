import { ITEM_PICKER_STYLES, ITEM_SHAPES, ItemPickerStyleSchema } from "@giftpop/contracts";
import type { ItemPickerStyle, ItemShape } from "@giftpop/contracts";

/** Plain names for each shape. A `Record` so a new contract shape fails typecheck until it has one. */
const SHAPE_LABELS: Record<ItemShape, string> = {
  bar: "Bar",
  bottle: "Bottle",
  jar: "Jar",
  box: "Box",
  mug: "Mug",
  flower: "Flower",
  card: "Card",
  "soft-toy": "Soft toy",
  balloon: "Balloon",
  perfume: "Perfume",
  candle: "Candle",
  jewellery: "Jewellery",
  cosmetic: "Cosmetic",
  cupcake: "Cupcake",
  frame: "Photo frame",
  other: "Other",
};

export function shapeLabel(shape: ItemShape): string {
  return SHAPE_LABELS[shape];
}

/** In contract order, so the select matches the list staff already know. */
export const SHAPE_OPTIONS = ITEM_SHAPES.map((shape) => ({
  value: shape,
  label: shapeLabel(shape),
}));

const PICKER_STYLE_LABELS: Record<ItemPickerStyle, { label: string; description: string }> = {
  tile: {
    label: "Show with a picture (item grid)",
    description: "The item gets its own tile with its picture.",
  },
  list: {
    label: "Show in the written list (name and price)",
    description: "The item is listed under the grid by name and price, without a picture.",
  },
};

export const DEFAULT_PICKER_STYLE: ItemPickerStyle = "tile";

export const PICKER_STYLE_OPTIONS = ITEM_PICKER_STYLES.map((value) => ({
  value,
  ...PICKER_STYLE_LABELS[value],
}));

/** Absent means tile, as the contract says. */
export function resolvePickerStyle(style: ItemPickerStyle | undefined): ItemPickerStyle {
  return style ?? DEFAULT_PICKER_STYLE;
}

/** The items-table badge: only written-list items get one, so the grid default stays quiet. */
export function pickerStyleBadge(style: ItemPickerStyle | undefined): string | null {
  return resolvePickerStyle(style) === "list" ? "Written list" : null;
}

/** Narrows a radio value back to a picker style; anything else falls back to the default. */
export function parsePickerStyle(value: string): ItemPickerStyle {
  const parsed = ItemPickerStyleSchema.safeParse(value);
  return parsed.success ? parsed.data : DEFAULT_PICKER_STYLE;
}
