import { describe, expect, it } from "vitest";

import {
  artPixelsPerPosterPixel,
  MAX_ITEM_TEXTURE_PX,
  MIN_ITEM_TEXTURE_PX,
} from "./art-resolution";
import { POSTER_VIEWBOX } from "./constants";
import { ITEM_ART_BOX, SPRITES } from "./sprites";

const itemPx = (k: number) => k * ITEM_ART_BOX.w;

describe("artPixelsPerPosterPixel", () => {
  it("covers every device pixel of the largest sprite on a 2x desktop stage", () => {
    const width = 700;
    const height = 680;
    const k = artPixelsPerPosterPixel(width, height, 2);
    const fit = Math.min(width / POSTER_VIEWBOX.w, height / POSTER_VIEWBOX.h);
    const largest = Math.max(...SPRITES.map((s) => s.scale));
    expect(itemPx(k)).toBeGreaterThanOrEqual(ITEM_ART_BOX.w * largest * fit * 2);
    expect(itemPx(k) % 64).toBe(0);
  });

  it("stays at the floor on a phone and at the ceiling on a huge screen", () => {
    expect(itemPx(artPixelsPerPosterPixel(200, 200, 1))).toBe(MIN_ITEM_TEXTURE_PX);
    expect(itemPx(artPixelsPerPosterPixel(4000, 4000, 2))).toBe(MAX_ITEM_TEXTURE_PX);
  });

  it("does not go past the renderer's 2x pixel ratio", () => {
    expect(artPixelsPerPosterPixel(600, 600, 3)).toBe(artPixelsPerPosterPixel(600, 600, 2));
  });

  it("is safe for zero, negative and missing sizes", () => {
    for (const [w, h, d] of [
      [0, 0, 0],
      [-5, 10, 1],
      [Number.NaN, 10, 2],
    ] as const) {
      expect(itemPx(artPixelsPerPosterPixel(w, h, d))).toBe(MIN_ITEM_TEXTURE_PX);
    }
  });
});
