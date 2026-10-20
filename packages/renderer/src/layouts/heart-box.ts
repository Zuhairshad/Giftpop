import { clamp, clampToScene, round2 } from "./geometry";
import { createRng, jitter } from "./prng";
import { expandDesignItems, type LayoutFn, type Placement } from "./types";

/**
 * The heart box's opening, seen from slightly above. The opening spans x 200..800: two lobes
 * with tops at `topY` (x about 350 and 650), a dip at (cx, dipY) and a point at (cx, bottomY).
 * The front wall (see the heart packaging art) hides the lower third of the front row.
 * Shared with the art: change both together.
 */
export const HEART_BOX_OPENING = Object.freeze({
  cx: 500,
  topY: 360,
  dipY: 420,
  bottomY: 650,
  halfWidth: 300,
});

/** Lobes are circles; below their centre line the sides run straight to the point. */
const LOBE_R = 170;
const LOBE_Y = 530;
const LOBE_DX = 130;
/** Items' base centres stay this far inside the outline. */
const EDGE_MARGIN = 40;
/** A point every placement can be pulled towards: always inside, and the heart is star-shaped around it. */
const SAFE = Object.freeze({ x: 500, y: 570 });
/** Height of the straight-sided part below the lobes' centre line. */
const TAPER_HEIGHT = HEART_BOX_OPENING.bottomY - LOBE_Y;

const MAX_BACK = 5;
const BACK_SPAN = { min: 290, max: 710 };
/** Base of a back item sits this far below the top of the lobe at its x. */
const BACK_DEPTH = 40;
const BACK_MAX_Y = 540;
const FRONT_HALF_SPAN = 148;
const FRONT_MAX_STEP = 120;
const FRONT_Y = { edge: 548, centre: 575 };
const ARC_Y = { edge: 545, centre: 558 };
const DIP_GAP = 45;

function inside(x: number, y: number): boolean {
  if (y > HEART_BOX_OPENING.bottomY - EDGE_MARGIN) return false;
  if (y > LOBE_Y) {
    const half =
      (HEART_BOX_OPENING.halfWidth * (HEART_BOX_OPENING.bottomY - y)) / TAPER_HEIGHT - EDGE_MARGIN;
    return Math.abs(x - HEART_BOX_OPENING.cx) <= half;
  }
  const d = Math.min(
    Math.hypot(x - (HEART_BOX_OPENING.cx - LOBE_DX), y - LOBE_Y),
    Math.hypot(x - (HEART_BOX_OPENING.cx + LOBE_DX), y - LOBE_Y),
  );
  return d <= LOBE_R - EDGE_MARGIN;
}

/** Move a point towards SAFE, the least distance that puts it inside the margin. */
function pullInside(x: number, y: number): { x: number; y: number } {
  if (inside(x, y)) return { x, y };
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (inside(x + (SAFE.x - x) * mid, y + (SAFE.y - y) * mid)) hi = mid;
    else lo = mid;
  }
  return { x: x + (SAFE.x - x) * hi, y: y + (SAFE.y - y) * hi };
}

/** Top edge of the lobes (inside the margin) at x. */
function lobeTop(x: number): number {
  const dx = Math.min(
    Math.abs(x - (HEART_BOX_OPENING.cx - LOBE_DX)),
    Math.abs(x - (HEART_BOX_OPENING.cx + LOBE_DX)),
  );
  const reach = LOBE_R - EDGE_MARGIN;
  const d = Math.min(dx, reach);
  return LOBE_Y - Math.sqrt(reach * reach - d * d);
}

/** The middle of the heart is the dip, so back items keep out of it. */
function awayFromDip(x: number): number {
  if (Math.abs(x - HEART_BOX_OPENING.cx) >= DIP_GAP) return x;
  return HEART_BOX_OPENING.cx + (x >= HEART_BOX_OPENING.cx ? DIP_GAP : -DIP_GAP);
}

function spread(rank: number, size: number, min: number, max: number): number {
  return size === 1 ? (min + max) / 2 : min + ((max - min) * rank) / (size - 1);
}

/**
 * Items standing in a heart box. 1 item is centred, 2-3 sit on a slight arc, 4 or more split
 * into a back row in the lobes and a front row narrowing towards the point. Wobble comes from
 * the seed; every base centre is kept inside the outline.
 */
export const heartBox: LayoutFn = ({ design }) => {
  const count = expandDesignItems(design).length;
  if (count === 0) return [];

  const rng = createRng(design.arrangementSeed);
  const scale = clamp(1.3 - count * 0.07, 0.62, 1.1);
  const firstInBack = rng() < 0.5;
  const backTarget = count <= 3 ? 0 : Math.min(MAX_BACK, Math.floor(count / 2));

  // Alternate rows by slot so neighbours zigzag; top up the back row if alternation fell short.
  const indexes = Array.from({ length: count }, (_, i) => i);
  const back = new Set(
    indexes.filter((i) => (i % 2 === 0) === firstInBack && backTarget > 0).slice(0, backTarget),
  );
  for (const i of indexes) if (back.size < backTarget && !back.has(i)) back.add(i);
  const frontSize = count - back.size;
  let backRank = 0;
  let frontRank = 0;

  return indexes.map((index): Placement => {
    const isBack = back.has(index);
    let x: number;
    let y: number;
    if (isBack) {
      x = awayFromDip(spread(backRank++, back.size, BACK_SPAN.min, BACK_SPAN.max)) + jitter(rng, 8);
      y = Math.min(lobeTop(x) + BACK_DEPTH, BACK_MAX_Y) + jitter(rng, 6);
    } else {
      const rank = frontRank++;
      const mid = (frontSize - 1) / 2;
      if (back.size === 0) {
        // Up to three items: one slight arc, ends higher than the middle.
        const step = frontSize === 1 ? 0 : Math.min(110, 240 / (frontSize - 1));
        x = HEART_BOX_OPENING.cx + (rank - mid) * step + jitter(rng, 8);
        const t = frontSize === 1 ? 1 : 1 - Math.abs(rank - mid) / mid;
        y = ARC_Y.edge + (ARC_Y.centre - ARC_Y.edge) * t + jitter(rng, 6);
      } else {
        const step = Math.min(FRONT_MAX_STEP, (2 * FRONT_HALF_SPAN) / Math.max(1, frontSize - 1));
        const offset = (rank - mid) * step;
        x = HEART_BOX_OPENING.cx + offset + jitter(rng, 8);
        const t = 1 - Math.min(1, Math.abs(offset) / FRONT_HALF_SPAN);
        y = FRONT_Y.edge + (FRONT_Y.centre - FRONT_Y.edge) * t + jitter(rng, 6);
      }
    }
    const safe = pullInside(x, y);
    const lean = ((safe.x - HEART_BOX_OPENING.cx) / HEART_BOX_OPENING.halfWidth) * 8;
    return {
      itemIndex: index,
      x: round2(clampToScene(safe.x)),
      y: round2(clampToScene(safe.y)),
      rotation: round2(lean + jitter(rng, 4)),
      scale: round2(isBack ? scale * 0.94 : scale),
      z: (isBack ? 0 : 100) + index,
    };
  });
};
