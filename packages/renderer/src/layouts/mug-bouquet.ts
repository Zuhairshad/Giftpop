import { clamp, clampToScene, round2 } from "./geometry";
import { createRng, jitter } from "./prng";
import { expandDesignItems, type LayoutFn, type Placement } from "./types";

/**
 * The mug's opening, seen from slightly above. The mug's front wall (see
 * `illustrations/packaging/mug-bouquet-front.tsx`) covers the items' lower part, so they stand in it.
 */
export const MUG_OPENING = Object.freeze({ cx: 470, cy: 470, rx: 170, ry: 44 });

/** Items rise from a point inside the mug and fan out like stems in a vase. */
const STEM_ORIGIN = { x: MUG_OPENING.cx, y: 640 };
const STEM_LENGTH = 330;
/** Widest fan, in degrees either side of upright, reached at 5 items. */
const MAX_SPREAD_DEG = 34;

/**
 * Items fanned out of a mug: evenly spread angles, the middle items tallest, with a seeded
 * wobble. Later items paint over earlier ones from the outside in, so the middle stays on top.
 */
export const mugBouquet: LayoutFn = ({ design }) => {
  const ids = expandDesignItems(design);
  const count = ids.length;
  if (count === 0) return [];

  const rng = createRng(design.arrangementSeed);
  const scale = clamp(1.4 - count * 0.06, 0.95, 1.3);
  const spread = count === 1 ? 0 : Math.min(MAX_SPREAD_DEG, 10 + count * 5);
  const flip = rng() < 0.5 ? -1 : 1;

  return ids.map((_, index): Placement => {
    const t = count === 1 ? 0 : (index / (count - 1)) * 2 - 1;
    const angleDeg = flip * t * spread + jitter(rng, 3);
    const angle = (angleDeg * Math.PI) / 180;
    // Outer stems are a little shorter, so the bunch reads as a dome.
    const length = STEM_LENGTH * (1 - Math.abs(t) * 0.14) + jitter(rng, 10);
    const x = STEM_ORIGIN.x + Math.sin(angle) * length;
    const y = STEM_ORIGIN.y - Math.cos(angle) * length;
    return {
      itemIndex: index,
      x: round2(clampToScene(x)),
      y: round2(clampToScene(y)),
      rotation: round2(angleDeg * 0.7 + jitter(rng, 3)),
      scale: round2(scale * (1 - Math.abs(t) * 0.06)),
      z: Math.round((1 - Math.abs(t)) * 100) + index,
    };
  });
};
