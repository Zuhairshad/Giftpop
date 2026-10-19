import type { Packaging } from "@giftpop/contracts";

import { SCENE_SIZE } from "./types";

/** The part of the 0 to 1000 scene square a scene shows, in scene units. */
export interface SceneBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const FULL_SCENE: SceneBounds = Object.freeze({
  x: 0,
  y: 0,
  width: SCENE_SIZE,
  height: SCENE_SIZE,
});

/**
 * Crops for layouts whose drawing leaves part of the square empty. The bouquet's blooms, wrapper
 * and ground shadow sit between y 230 and 970: the top is set by the back-tier centre item at 5
 * items with an image anchored at its bottom edge (the upload default), the bottom by the shadow.
 */
const CROPS: Readonly<Record<string, SceneBounds>> = {
  "bouquet-fan": Object.freeze({ x: 30, y: 230, width: 940, height: 740 }),
};

/**
 * The scene box to show for a layout. Uploaded packaging layers are drawn on the whole square,
 * so a packaging with any layer image always shows the full scene.
 */
export function sceneBounds(layoutType: string, hasLayerImages = false): SceneBounds {
  if (hasLayerImages) return FULL_SCENE;
  return (Object.hasOwn(CROPS, layoutType) ? CROPS[layoutType] : undefined) ?? FULL_SCENE;
}

/** `sceneBounds` for a packaging, so callers can size a container to the scene it will draw. */
export function packagingSceneBounds(
  packaging: Pick<Packaging, "layoutType" | "layers">,
): SceneBounds {
  return sceneBounds(
    packaging.layoutType,
    Boolean(packaging.layers.back ?? packaging.layers.front),
  );
}
