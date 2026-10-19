import { bouquetFan } from "./bouquet-fan";
import { boxGrid } from "./box-grid";
import type { LayoutFn, LayoutInput, Placement } from "./types";

export { createRng } from "./prng";
export { ITEM_BASE_SIZE, SCENE_SIZE, expandDesignItems } from "./types";
export type { LayoutFn, LayoutInput, Placement } from "./types";

/** The one registry. A new layout type is one function, its tests, and one line here. */
export const LAYOUTS = {
  "bouquet-fan": bouquetFan,
  "box-grid": boxGrid,
} as const satisfies Record<string, LayoutFn>;

export type KnownLayoutType = keyof typeof LAYOUTS;

export const LAYOUT_TYPES = Object.keys(LAYOUTS) as KnownLayoutType[];

export function isKnownLayoutType(layoutType: string): layoutType is KnownLayoutType {
  return Object.hasOwn(LAYOUTS, layoutType);
}

export function getLayout(layoutType: string): LayoutFn {
  if (!isKnownLayoutType(layoutType)) {
    throw new Error(
      `Unknown layoutType "${layoutType}". Registered layout types: ${LAYOUT_TYPES.join(", ")}.`,
    );
  }
  return LAYOUTS[layoutType];
}

/** Placements for a design in its packaging, using the packaging's layout type. */
export function computePlacements(input: LayoutInput): Placement[] {
  return getLayout(input.packaging.layoutType)(input);
}
