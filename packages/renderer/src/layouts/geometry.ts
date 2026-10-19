import { SCENE_SIZE } from "./types";

/** Keep a placement's anchor point away from the scene edge. */
export const SCENE_MARGIN = 40;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function clampToScene(value: number): number {
  return clamp(value, SCENE_MARGIN, SCENE_SIZE - SCENE_MARGIN);
}

/** Round to 2 decimals so serialised placements stay short and stable. */
export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
