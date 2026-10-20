import { clamp, clampToScene, round2 } from "./geometry";
import { createRng, jitter } from "./prng";
import { expandDesignItems, type LayoutFn, type Placement } from "./types";

/**
 * The basket's opening, seen from slightly above. The woven front wall and tissue (see
 * `illustrations/packaging/basket-front.tsx`) cover the items' lower part.
 */
export const BASKET_OPENING = Object.freeze({ cx: 500, cy: 540, rx: 320, ry: 78 });

/** Centre heights of the rows: the back row sits higher so the pile reads as a mound. */
const BACK_Y = 420;
const FRONT_Y = 505;
/** How wide a row may spread, centre to centre, and the most room one item gets. */
const BACK_SPAN = 420;
const FRONT_SPAN = 480;
const MAX_STEP = 150;

/**
 * Items heaped in a basket: a back row and a front row, the middle of each row raised a little
 * (a mound), items leaning outwards, with a seeded wobble so no two baskets look stamped out.
 */
export const basket: LayoutFn = ({ design }) => {
  const ids = expandDesignItems(design);
  const count = ids.length;
  if (count === 0) return [];

  const rng = createRng(design.arrangementSeed);
  const scale = clamp(1.6 - count * 0.05, 1.05, 1.4);
  const backCount = count <= 2 ? 0 : Math.ceil(count / 2);
  const frontCount = count - backCount;

  return ids.map((_, index): Placement => {
    const back = index < backCount;
    const rank = back ? index : index - backCount;
    const size = back ? backCount : frontCount;
    const span = back ? BACK_SPAN : FRONT_SPAN;
    const step = Math.min(MAX_STEP, span / Math.max(1, size - 1));
    const offset = size === 1 ? 0 : rank - (size - 1) / 2;
    const u = size === 1 ? 0 : offset / ((size - 1) / 2);
    const x = BASKET_OPENING.cx + offset * step + jitter(rng, 12);
    const mound = (1 - u * u) * 40;
    const y = (back ? BACK_Y : FRONT_Y) - mound + jitter(rng, 10);
    return {
      itemIndex: index,
      x: round2(clampToScene(x)),
      y: round2(clampToScene(y)),
      rotation: round2(u * 14 + jitter(rng, 6)),
      scale: round2(back ? scale * 0.94 : scale),
      z: (back ? 0 : 100) + index,
    };
  });
};
