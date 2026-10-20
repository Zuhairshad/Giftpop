import { POSTER_VIEWBOX } from "./constants";
import { ITEM_ART_BOX, SPRITES } from "./sprites";

/** Item textures are never smaller than this (phones) nor larger than this (big desktop screens). */
export const MIN_ITEM_TEXTURE_PX = 256;
export const MAX_ITEM_TEXTURE_PX = 1024;
/** The renderer caps the canvas pixel ratio at this, so textures need no more. */
export const MAX_PIXEL_RATIO = 2;

const LARGEST_SPRITE_SCALE = Math.max(...SPRITES.map((s) => s.scale));

/**
 * Texture pixels per poster pixel for the sprite art, so the largest sprite is drawn at least
 * 1:1 with the device pixels it covers (crisp on 2x screens) without wasting memory on phones.
 * The camera fits the whole poster in the stage, like the SVG's `meet`.
 */
export function artPixelsPerPosterPixel(
  stageWidth: number,
  stageHeight: number,
  devicePixelRatio: number,
): number {
  const fit = Math.min(stageWidth / POSTER_VIEWBOX.w, stageHeight / POSTER_VIEWBOX.h);
  const dpr = Math.min(Math.max(devicePixelRatio || 1, 1), MAX_PIXEL_RATIO);
  const needed = ITEM_ART_BOX.w * LARGEST_SPRITE_SCALE * (Number.isFinite(fit) ? fit : 0) * dpr;
  const px = Math.ceil(needed / 64) * 64;
  return Math.min(Math.max(px, MIN_ITEM_TEXTURE_PX), MAX_ITEM_TEXTURE_PX) / ITEM_ART_BOX.w;
}
