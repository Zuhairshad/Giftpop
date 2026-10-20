import { clamp, round2 } from "./geometry";
import { createRng, jitter, shuffleInPlace } from "./prng";
import { expandDesignItems, ITEM_BASE_SIZE, type LayoutFn, type Placement } from "./types";

/**
 * The crate the items are packed into, in scene units. Shared with the art: change both together.
 * `rimY` is the top edge of the front rim; items rest just behind it. `innerLeft` and `innerRight`
 * are the inside faces of the side slats at item height.
 */
export const SNACK_HAMPER = Object.freeze({
  rimY: 680,
  innerLeft: 215,
  innerRight: 785,
  centerX: 500,
});

/** Biggest item size (scene units) and how much neighbours overlap along a row. */
const MAX_SIZE = 190;
const ROW_STEP = 0.84;
/** The back row sits further up and is drawn a little taller than the front row. */
const BACK_ROW_LIFT = 0.58;
const BACK_ROW_GROWTH = 1.08;

interface Slot {
  x: number;
  row: 0 | 1;
  rank: number;
  inRow: number;
}

/** One row for a single item, otherwise a back row (the smaller half) and a front row. */
function rowCounts(count: number): { back: number; front: number } {
  if (count <= 1) return { back: 0, front: count };
  return { back: Math.floor(count / 2), front: Math.ceil(count / 2) };
}

/**
 * Items packed loosely into a shallow open crate seen from above: a back row of taller items and
 * a front row lower down, each leaning a little towards its neighbours. Which item takes which
 * slot is shuffled by the seed, as is the wobble. Pure and deterministic.
 */
export const snackHamper: LayoutFn = ({ design }) => {
  const count = expandDesignItems(design).length;
  if (count === 0) return [];

  const rng = createRng(design.arrangementSeed);
  const { back, front } = rowCounts(count);
  const widest = Math.max(back, front);
  const innerWidth = SNACK_HAMPER.innerRight - SNACK_HAMPER.innerLeft;
  // Size so the widest row fits between the side slats.
  const size = clamp(innerWidth / (widest * ROW_STEP + 0.3), 100, MAX_SIZE);
  const scale = size / ITEM_BASE_SIZE;
  const step = size * ROW_STEP;

  const frontY = SNACK_HAMPER.rimY - size * 0.5 - 22;
  const backY = frontY - size * BACK_ROW_LIFT;

  const slots: Slot[] = [];
  for (let k = 0; k < back; k++) {
    const x = SNACK_HAMPER.centerX + (k - (back - 1) / 2) * step;
    slots.push({ x, row: 0, rank: k, inRow: back });
  }
  for (let k = 0; k < front; k++) {
    const x = SNACK_HAMPER.centerX + (k - (front - 1) / 2) * step;
    slots.push({ x, row: 1, rank: k, inRow: front });
  }

  shuffleInPlace(rng, slots);

  return slots.map((slot, itemIndex): Placement => {
    const isFront = slot.row === 1;
    const itemScale = isFront ? scale : scale * BACK_ROW_GROWTH;
    const half = (itemScale * ITEM_BASE_SIZE) / 2;
    const x = clamp(
      slot.x + jitter(rng, size * 0.05),
      SNACK_HAMPER.innerLeft + half * 0.7,
      SNACK_HAMPER.innerRight - half * 0.7,
    );
    const y = (isFront ? frontY : backY) + jitter(rng, 8);
    // Lean towards the middle of the row, the front row a bit more than the back one.
    const lean = slot.inRow > 1 ? ((slot.rank / (slot.inRow - 1)) * 2 - 1) * (isFront ? 9 : 5) : 0;
    return {
      itemIndex,
      x: round2(x),
      y: round2(y),
      rotation: round2(lean + jitter(rng, isFront ? 5 : 3)),
      scale: round2(itemScale),
      // Back row below the front row; within a row, later slots on top.
      z: slot.row * 20 + slot.rank,
    };
  });
};
