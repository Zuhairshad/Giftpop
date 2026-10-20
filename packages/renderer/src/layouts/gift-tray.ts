import { clampToScene, round2 } from "./geometry";
import { createRng, jitter } from "./prng";
import { expandDesignItems, ITEM_BASE_SIZE, type LayoutFn, type Placement } from "./types";

/**
 * The tray seen from the front and slightly above. Shared with the art
 * (`illustrations/packaging/gift-tray-*.tsx`): change both together.
 * `left`/`right` are the rim's outer ends, `backY` the far rim line, `frontY` the near rim line
 * (the front wall hangs below it) and `bottomY` the foot of the front wall.
 */
export const GIFT_TRAY = Object.freeze({
  left: 110,
  right: 890,
  backY: 478,
  frontY: 640,
  bottomY: 748,
});

/** Items must stay between these x values (inside the rim, clear of the handles). */
const INNER_LEFT = 160;
const INNER_RIGHT = 840;
/** Centre line of a lone row, and of the back and front rows of a pair. */
const SINGLE_Y = 505;
const BACK_Y = 440;
const FRONT_Y = 525;
/** Neighbours sit this fraction of an item width apart, so they overlap only a little. */
const STEP_RATIO = 0.86;
const MAX_SCALE = 1.25;
const MAX_TWO_ROW_SCALE = 0.85;
/** Wobble is small and counted in the fit, so items never reach past the rim. */
const WOBBLE_X = 6;
const WOBBLE_Y = 6;

/** One row up to 4 items, then two rows with the extra item (if any) in the front row. */
export function trayRows(count: number): number[] {
  if (count <= 4) return [count];
  const back = Math.floor(count / 2);
  return [back, count - back];
}

/** Item scale for a count: the widest row fills the tray, wider rows shrink the items. */
export function trayScale(count: number): number {
  const rows = trayRows(count);
  const widest = Math.max(...rows);
  const room = INNER_RIGHT - INNER_LEFT - 2 * WOBBLE_X;
  const fit = room / (ITEM_BASE_SIZE * (STEP_RATIO * (widest - 1) + 1));
  return Math.min(rows.length === 1 ? MAX_SCALE : MAX_TWO_ROW_SCALE, fit);
}

/**
 * Items standing upright side by side in one or two neat rows along a wide flat tray. Rows are
 * centred on x 500 and evenly spaced; the seed shuffles who takes which slot and adds a small
 * wobble. Pure and deterministic.
 */
export const giftTray: LayoutFn = ({ design }) => {
  const count = expandDesignItems(design).length;
  if (count === 0) return [];

  const rng = createRng(design.arrangementSeed);
  const scale = trayScale(count);
  const step = ITEM_BASE_SIZE * scale * STEP_RATIO;
  const rows = trayRows(count);

  const slots: { x: number; y: number; row: number }[] = [];
  rows.forEach((n, row) => {
    const y = rows.length === 1 ? SINGLE_Y : row === 0 ? BACK_Y : FRONT_Y;
    for (let k = 0; k < n; k++) slots.push({ x: 500 + (k - (n - 1) / 2) * step, y, row });
  });

  for (let i = count - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const a = slots[i];
    const b = slots[j];
    if (a && b) {
      slots[i] = b;
      slots[j] = a;
    }
  }

  return slots.map((slot, index): Placement => ({
    itemIndex: index,
    x: round2(clampToScene(slot.x + jitter(rng, WOBBLE_X))),
    y: round2(clampToScene(slot.y + jitter(rng, WOBBLE_Y))),
    rotation: round2(jitter(rng, 3)),
    scale: round2(scale),
    z: slot.row * 100 + index,
  }));
};
