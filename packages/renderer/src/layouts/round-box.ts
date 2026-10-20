import { clamp, clampToScene, round2 } from "./geometry";
import { createRng, jitter } from "./prng";
import { expandDesignItems, type LayoutFn, type Placement } from "./types";

/**
 * The hat box's opening, seen from slightly above: an ellipse about (500, 480). The drum's
 * front wall and tissue (see `illustrations/packaging/round-box-front.tsx`) cover the items'
 * lower third, so they stand in the box instead of floating over it.
 */
export const ROUND_BOX_OPENING = Object.freeze({ cx: 500, cy: 480, rx: 300, ry: 90 });

/** Centre heights of the rows: the back row stands taller, the front row's bases are tucked in. */
const BACK_Y = 380;
const FRONT_Y = 478;
const SINGLE_Y = 455;
/** How wide a row may spread, centre to centre, and the most room one item gets. */
const ROW_SPAN = 450;
const MAX_STEP = 160;
/** Items lean outwards a little towards the drum's sides. */
const SIDE_LEAN_DEG = 8;

interface Seat {
  back: boolean;
  /** Position in its row, from the left. */
  rank: number;
  /** Items in its row. */
  size: number;
}

/** Items alternate rows so neighbours zigzag; the seed picks which row the first item takes. */
function seats(count: number, firstInBack: boolean): Seat[] {
  if (count <= 3) {
    return Array.from({ length: count }, (_, i) => ({ back: false, rank: i, size: count }));
  }
  const inBack = (i: number) => (i % 2 === 0) === firstInBack;
  const backSize = Array.from({ length: count }, (_, i) => i).filter(inBack).length;
  let backRank = 0;
  let frontRank = 0;
  return Array.from({ length: count }, (_, i) =>
    inBack(i)
      ? { back: true, rank: backRank++, size: backSize }
      : { back: false, rank: frontRank++, size: count - backSize },
  );
}

/**
 * Items standing in a round hat box: one row for up to 3 items, otherwise a back row and a
 * front row, each centred in the opening. Row offsets and wobble come from the seed.
 */
export const roundBox: LayoutFn = ({ design }) => {
  const ids = expandDesignItems(design);
  const count = ids.length;
  if (count === 0) return [];

  const rng = createRng(design.arrangementSeed);
  const scale = clamp(1.4 - count * 0.07, 0.8, 1.3);
  const layout = seats(count, rng() < 0.5);
  const backSize = layout.filter((s) => s.back).length;
  // With equal rows the front row slides a quarter step, so it fills the gaps of the back row.
  const shiftDirection = rng() < 0.5 ? -1 : 1;

  return layout.map((seat, index): Placement => {
    const step = Math.min(MAX_STEP, ROW_SPAN / Math.max(1, seat.size - 1));
    const evenRows = backSize === count - backSize;
    const shift = !seat.back && evenRows ? (shiftDirection * step) / 4 : 0;
    const rowX = ROUND_BOX_OPENING.cx + (seat.rank - (seat.size - 1) / 2) * step + shift;
    const x = rowX + jitter(rng, 10);
    const rowY = count <= 3 ? SINGLE_Y : seat.back ? BACK_Y : FRONT_Y;
    const y = rowY + jitter(rng, 8);
    const lean = ((x - ROUND_BOX_OPENING.cx) / ROUND_BOX_OPENING.rx) * SIDE_LEAN_DEG;
    return {
      itemIndex: index,
      x: round2(clampToScene(x)),
      y: round2(clampToScene(y)),
      rotation: round2(lean + jitter(rng, 4)),
      scale: round2(seat.back ? scale * 0.94 : scale),
      z: (seat.back ? 0 : 100) + index,
    };
  });
};
