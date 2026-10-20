import { basket } from "./basket";
import { bouquetFan } from "./bouquet-fan";
import { boxGrid } from "./box-grid";
import { heartBox } from "./heart-box";
import { mugBouquet } from "./mug-bouquet";
import { roundBox } from "./round-box";
import type { LayoutFn, LayoutInput, Placement } from "./types";

export { FULL_SCENE, packagingSceneBounds, sceneBounds } from "./bounds";
export type { SceneBounds } from "./bounds";
export { ITEM_BASE_SIZE, SCENE_SIZE, expandDesignItems } from "./types";
export type { LayoutFn, LayoutInput, Placement } from "./types";

/** The one registry. A new layout type is one function, its tests, and one line here. */
export const LAYOUTS = {
  "bouquet-fan": bouquetFan,
  "box-grid": boxGrid,
  "round-box": roundBox,
  "heart-box": heartBox,
  "mug-bouquet": mugBouquet,
  basket,
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
