import { clamp, clampToScene, round2 } from "./geometry";
import { createRng, jitter } from "./prng";
import { expandDesignItems, ITEM_BASE_SIZE, type LayoutFn, type Placement } from "./types";

/** Stems meet here; the wrapper's front panels (tops on a radius-270 arc about it) cover the bases. */
const GATHER = { x: 500, y: 860 };
/** The back paper's crinkled edge at its scallop peaks: no item reaches further out than this. */
const PAPER_RADIUS = 445;
/** Centres of the front tier sit just above the front panels, so their lower third is tucked in. */
const FRONT_RADIUS = 300;
/** Centres of a single-tier bouquet (4 items or fewer). */
const SINGLE_RADIUS = 320;
const RADIUS_JITTER = 10;
const MAX_SPREAD_DEG = 80;
const SPREAD_PER_ITEM_DEG = 12;
const BASE_SPREAD_DEG = 8;
/** The front tier fans a little narrower, so it stays over the front panels. */
const FRONT_SPREAD = 0.8;
/** Items lean with the fan, but less than the ray they sit on. */
const LEAN = 0.6;

/**
 * Items fan out from a gather point, seated in the wrapper: a back tier whose tops stay inside
 * the paper's edge and a front tier whose bases go behind the front panels.
 */
export const bouquetFan: LayoutFn = ({ design }) => {
  const ids = expandDesignItems(design);
  const count = ids.length;
  if (count === 0) return [];

  const rng = createRng(design.arrangementSeed);
  const spread = Math.min(MAX_SPREAD_DEG, BASE_SPREAD_DEG + count * SPREAD_PER_ITEM_DEG);
  const scale = clamp(1.3 - count * 0.05, 0.75, 1.15);
  const twoTiers = count > 4;
  const backScale = scale * 0.92;
  // The back tier's tops (half the item above its centre) end at the paper's edge.
  const backRadius = PAPER_RADIUS - (backScale * ITEM_BASE_SIZE) / 2 - RADIUS_JITTER;
  // The seed picks which tier the first item lands in, so a new seed reshuffles tiers.
  const tierOffset = rng() < 0.5 ? 0 : 1;

  return ids.map((_, index): Placement => {
    const t = count === 1 ? 0.5 : index / (count - 1);
    const back = twoTiers && (index + tierOffset) % 2 === 0;
    const tierSpread = twoTiers && !back ? spread * FRONT_SPREAD : spread;
    const angle = (t - 0.5) * tierSpread + jitter(rng, 3);
    const base = !twoTiers ? SINGLE_RADIUS : back ? backRadius : FRONT_RADIUS;
    const radius = base + jitter(rng, RADIUS_JITTER);
    const rad = (angle * Math.PI) / 180;
    return {
      itemIndex: index,
      x: round2(clampToScene(GATHER.x + radius * Math.sin(rad))),
      y: round2(clampToScene(GATHER.y - radius * Math.cos(rad))),
      rotation: round2(angle * LEAN),
      scale: round2(back ? backScale : scale),
      z: (back ? 0 : 100) + index,
    };
  });
};
