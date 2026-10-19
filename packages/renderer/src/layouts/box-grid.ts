import { clampToScene, round2 } from "./geometry";
import { createRng, jitter } from "./prng";
import { expandDesignItems, ITEM_BASE_SIZE, type LayoutFn, type Placement } from "./types";

const INNER_MIN = 150;
const INNER_SIZE = 700;
const FILL = 0.85;

/**
 * Top-down grid sized from the packaging, so adding items never reflows the
 * ones already placed. A partly filled last row is centred.
 */
export const boxGrid: LayoutFn = ({ design, packaging }) => {
  const ids = expandDesignItems(design);
  const count = ids.length;
  if (count === 0) return [];

  const cells = Math.max(packaging.maxItems, count);
  const cols = Math.ceil(Math.sqrt(cells));
  const rows = Math.ceil(cells / cols);
  const cell = INNER_SIZE / Math.max(cols, rows);
  const scale = (cell * FILL) / ITEM_BASE_SIZE;
  const top = INNER_MIN + (INNER_SIZE - rows * cell) / 2;
  const rng = createRng(design.arrangementSeed);

  return ids.map((_, index): Placement => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    const inRow = Math.min(cols, count - row * cols);
    const rowLeft = INNER_MIN + (INNER_SIZE - inRow * cell) / 2;
    const wobble = cell * 0.04;
    return {
      itemIndex: index,
      x: round2(clampToScene(rowLeft + (col + 0.5) * cell + jitter(rng, wobble))),
      y: round2(clampToScene(top + (row + 0.5) * cell + jitter(rng, wobble))),
      rotation: round2(jitter(rng, 6)),
      scale: round2(scale),
      z: index,
    };
  });
};
