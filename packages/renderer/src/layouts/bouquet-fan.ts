import { clamp, clampToScene, round2 } from "./geometry";
import { createRng, jitter } from "./prng";
import { expandDesignItems, type LayoutFn, type Placement } from "./types";

/** Stems meet here; the wrapper's front layer covers everything below the blooms. */
const GATHER = { x: 500, y: 860 };
const BACK_RADIUS = 440;
const FRONT_RADIUS = 330;
const MAX_SPREAD_DEG = 110;
const SPREAD_PER_ITEM_DEG = 14;
const BASE_SPREAD_DEG = 10;

/** Items fan out from a gather point. Outer tier sits further out and behind. */
export const bouquetFan: LayoutFn = ({ design }) => {
  const ids = expandDesignItems(design);
  const count = ids.length;
  if (count === 0) return [];

  const rng = createRng(design.arrangementSeed);
  const spread = Math.min(MAX_SPREAD_DEG, BASE_SPREAD_DEG + count * SPREAD_PER_ITEM_DEG);
  const scale = clamp(1.15 - count * 0.04, 0.6, 1.1);
  const twoTiers = count > 4;
  // The seed picks which tier the first item lands in, so a new seed reshuffles tiers.
  const tierOffset = rng() < 0.5 ? 0 : 1;

  return ids.map((_, index): Placement => {
    const t = count === 1 ? 0.5 : index / (count - 1);
    const angle = (t - 0.5) * spread + jitter(rng, 3);
    const back = twoTiers && (index + tierOffset) % 2 === 0;
    const radius = (back ? BACK_RADIUS : FRONT_RADIUS) + jitter(rng, 18);
    const rad = (angle * Math.PI) / 180;
    return {
      itemIndex: index,
      x: round2(clampToScene(GATHER.x + radius * Math.sin(rad))),
      y: round2(clampToScene(GATHER.y - radius * Math.cos(rad))),
      rotation: round2(angle),
      scale: round2(back ? scale * 0.92 : scale),
      z: (back ? 0 : 100) + index,
    };
  });
};
