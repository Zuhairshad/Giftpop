import { clamp, clampToScene, round2 } from "./geometry";
import { createRng, jitter } from "./prng";
import { expandDesignItems, ITEM_BASE_SIZE, type LayoutFn, type Placement } from "./types";

/**
 * Where the balloon strings gather above the base box. Shared with the art: change both together.
 */
export const BALLOON_GIFT_KNOT = Object.freeze({ x: 500, y: 690 });

/** Centre line of the cluster and the lowest a balloon centre may sit (the box top is near 700). */
const CLUSTER_CY = 360;
const MAX_Y = 540;

/** Row sizes for a count: one row up to 2 items, two up to 5, three above. Widest row in the middle. */
function rowSizes(count: number): number[] {
  const rows = count <= 2 ? 1 : count <= 5 ? 2 : 3;
  const base = Math.floor(count / rows);
  const extra = count - base * rows;
  const sizes = Array.from({ length: rows }, () => base);
  // Extras go to the middle row first, then the rows beside it.
  const order = rows === 3 ? [1, 0, 2] : rows === 2 ? [1, 0] : [0];
  for (let i = 0; i < extra; i++) {
    const row = order[i % order.length] ?? 0;
    sizes[row] = (sizes[row] ?? 0) + 1;
  }
  return sizes;
}

/**
 * Items as a balloon cluster floating above a small base box: rows of 1 to 4, each row centred on
 * x 500, tilting outward from the middle. Which item takes which slot is shuffled by the seed, as
 * is the small wobble. Pure and deterministic.
 */
export const balloonGift: LayoutFn = ({ design }) => {
  const count = expandDesignItems(design).length;
  if (count === 0) return [];

  const rng = createRng(design.arrangementSeed);
  const scale = clamp(1.25 - count * 0.07, 0.62, 1.1);
  const size = ITEM_BASE_SIZE * scale;
  const xStep = size * 0.95;
  const yStep = size * 0.78;

  const sizes = rowSizes(count);
  const slots: { x: number; y: number }[] = [];
  sizes.forEach((n, row) => {
    const y = CLUSTER_CY + (row - (sizes.length - 1) / 2) * yStep;
    for (let k = 0; k < n; k++) slots.push({ x: 500 + (k - (n - 1) / 2) * xStep, y });
  });

  // Seeded shuffle of the slots: item i then takes shuffled slot i.
  for (let i = count - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const a = slots[i];
    const b = slots[j];
    if (a && b) {
      slots[i] = b;
      slots[j] = a;
    }
  }

  return slots.map((slot, rank): Placement => {
    const x = slot.x + jitter(rng, 9);
    const y = Math.min(slot.y + jitter(rng, 9), MAX_Y);
    return {
      itemIndex: rank,
      x: round2(clampToScene(x)),
      y: round2(clampToScene(y)),
      rotation: round2(((x - 500) / 500) * 14 + jitter(rng, 5)),
      scale: round2(scale),
      z: rank,
    };
  });
};
