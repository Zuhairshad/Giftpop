import type { Design, Packaging } from "@giftpop/contracts";

/** The scene is a square coordinate space, 0 to SCENE_SIZE on both axes. */
export const SCENE_SIZE = 1000;

/** Edge length, in scene units, of an item at `scale` 1. */
export const ITEM_BASE_SIZE = 200;

/**
 * Where one item goes. `x`/`y` is the item's anchor point in scene space,
 * `rotation` is degrees clockwise around that point, `z` is paint order
 * (higher paints on top). `itemIndex` indexes the list from `expandDesignItems`.
 */
export interface Placement {
  itemIndex: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  z: number;
}

export interface LayoutInput {
  design: Design;
  packaging: Packaging;
}

/** A layout is a pure function: same input, same placements. */
export type LayoutFn = (input: LayoutInput) => Placement[];

/** Item ids expanded by qty, in slot order. `Placement.itemIndex` points into this list. */
export function expandDesignItems(design: Design): string[] {
  return [...design.items]
    .sort((a, b) => a.slot - b.slot)
    .flatMap((line) => Array.from({ length: line.qty }, () => line.itemId));
}
