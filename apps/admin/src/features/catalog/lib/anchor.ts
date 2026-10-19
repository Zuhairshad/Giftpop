import type { Asset } from "@giftpop/contracts";

export type Anchor = Asset["anchor"];

/** Matches the API's default for a new upload: bottom centre, where a slot holds the item. */
export const DEFAULT_ANCHOR: Anchor = { x: 0.5, y: 1 };

/** Arrow keys move the marker by 1% of the image; Shift moves it by 5%. */
export const ANCHOR_STEP = 0.01;
export const ANCHOR_STEP_LARGE = 0.05;

export interface PointerRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

function clampUnit(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/** Keeps the anchor inside the image and at three decimals, so saved values stay tidy. */
export function normaliseAnchor(anchor: Anchor): Anchor {
  return {
    x: Math.round(clampUnit(anchor.x) * 1000) / 1000,
    y: Math.round(clampUnit(anchor.y) * 1000) / 1000,
  };
}

/** Where a pointer is over the image, as an anchor. A zero-size image gives the default. */
export function pointerToAnchor(
  point: { clientX: number; clientY: number },
  rect: PointerRect,
): Anchor {
  if (rect.width <= 0 || rect.height <= 0) return { ...DEFAULT_ANCHOR };
  return normaliseAnchor({
    x: (point.clientX - rect.left) / rect.width,
    y: (point.clientY - rect.top) / rect.height,
  });
}

const ARROWS: Record<string, readonly [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

export function isArrowKey(key: string): boolean {
  return Object.hasOwn(ARROWS, key);
}

/** Moves the anchor one step for an arrow key. Other keys leave it as it is. */
export function nudgeAnchor(anchor: Anchor, key: string, large = false): Anchor {
  const direction = ARROWS[key];
  if (!direction) return anchor;
  const step = large ? ANCHOR_STEP_LARGE : ANCHOR_STEP;
  return normaliseAnchor({
    x: anchor.x + direction[0] * step,
    y: anchor.y + direction[1] * step,
  });
}

/** Percent strings for CSS `left` and `top`. */
export function anchorToPercent(anchor: Anchor): { left: string; top: string } {
  return { left: `${anchor.x * 100}%`, top: `${anchor.y * 100}%` };
}

/** Whole-number percent for display and number inputs. */
export function toPercentValue(unit: number): number {
  return Math.round(clampUnit(unit) * 100);
}

export function fromPercentValue(percent: number): number {
  return normaliseAnchor({ x: percent / 100, y: 0 }).x;
}

export function sameAnchor(a: Anchor, b: Anchor): boolean {
  return a.x === b.x && a.y === b.y;
}
