import { POSTER_ORIGIN, POSTER_UNITS_PER_WORLD_UNIT } from "./constants";

export interface Point2 {
  x: number;
  y: number;
}

/** Poster pixels (y down) to world units (y up, 0 at the poster's centre). */
export function posterToWorld(px: number, py: number): Point2 {
  return {
    x: (px - POSTER_ORIGIN.x) / POSTER_UNITS_PER_WORLD_UNIT,
    y: (POSTER_ORIGIN.y - py) / POSTER_UNITS_PER_WORLD_UNIT,
  };
}

/** The inverse of `posterToWorld`. */
export function worldToPoster(x: number, y: number): Point2 {
  return {
    x: POSTER_ORIGIN.x + x * POSTER_UNITS_PER_WORLD_UNIT,
    y: POSTER_ORIGIN.y - y * POSTER_UNITS_PER_WORLD_UNIT,
  };
}

export const degToRad = (deg: number): number => (deg * Math.PI) / 180;
