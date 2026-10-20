import { clamp, round2 } from "./geometry";
import { createRng, jitter } from "./prng";
import { expandDesignItems, ITEM_BASE_SIZE, type LayoutFn, type Placement } from "./types";

/** Outer edge of the picture frame, in scene units. Shared with the art: change both together. */
export const FRAMED_GIFT_FRAME = Object.freeze({ x: 80, y: 110, width: 840, height: 780 });

/** The opening inside the mat where the items hang. Shared with the art. */
export const FRAMED_GIFT_WINDOW = Object.freeze({ x: 200, y: 230, width: 600, height: 540 });

/** Where the hanging cord meets the nail above the frame. Shared with the art. */
export const FRAMED_GIFT_HANGER = Object.freeze({ x: 500, y: 62 });

/** Items keep this far from the window edge, so wobble and tilt never touch the mat. */
const PAD = 22;
const WOBBLE = 6;
const CX = FRAMED_GIFT_WINDOW.x + FRAMED_GIFT_WINDOW.width / 2;
const CY = FRAMED_GIFT_WINDOW.y + FRAMED_GIFT_WINDOW.height / 2;
const USABLE_W = FRAMED_GIFT_WINDOW.width - PAD * 2;
const HERO_SCALE = 1.5;
const HERO_Y = 395;
const ROW_Y = 660;
const GRID_ROW_GAP = 215;

interface Slot {
  x: number;
  y: number;
  scale: number;
}

/** `count` slots on one centred row at height `y`, sized to the cell width and capped at `maxScale`. */
function rowSlots(count: number, y: number, maxScale: number): Slot[] {
  const cell = USABLE_W / count;
  const scale = Math.min(maxScale, (cell * 1.1) / ITEM_BASE_SIZE);
  return Array.from({ length: count }, (_, k) => ({
    x: CX + (k - (count - 1) / 2) * cell,
    y,
    scale,
  }));
}

/** The slot plan for a count: a lone item, a pair, a hero over a row, or two hung rows. */
function slotsFor(count: number): Slot[] {
  if (count === 1) return [{ x: CX, y: CY, scale: 1.8 }];
  if (count === 2) return rowSlots(2, CY, 1.3);
  if (count <= 6) {
    return [{ x: CX, y: HERO_Y, scale: HERO_SCALE }, ...rowSlots(count - 1, ROW_Y, 0.9)];
  }
  const top = Math.ceil(count / 2);
  return [
    ...rowSlots(top, CY - GRID_ROW_GAP / 2, 1),
    ...rowSlots(count - top, CY + GRID_ROW_GAP / 2, 1),
  ];
}

/**
 * Items hung like a gallery wall inside a picture frame's mat: one hero item over a row of
 * smaller ones for 3 to 6 items, two tidy rows for 7 to 10. Which item takes which slot is
 * shuffled by the seed, as is a small wobble and tilt. Pure and deterministic.
 */
export const framedGift: LayoutFn = ({ design }) => {
  const count = expandDesignItems(design).length;
  if (count === 0) return [];

  const rng = createRng(design.arrangementSeed);
  const slots = slotsFor(count);

  // Seeded shuffle: item i then takes shuffled slot i.
  for (let i = count - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const a = slots[i];
    const b = slots[j];
    if (a && b) {
      slots[i] = b;
      slots[j] = a;
    }
  }

  const { x: wx, y: wy, width, height } = FRAMED_GIFT_WINDOW;
  return slots.map((slot, rank): Placement => {
    const reach = (slot.scale * ITEM_BASE_SIZE) / 2;
    return {
      itemIndex: rank,
      x: round2(clamp(slot.x + jitter(rng, WOBBLE), wx + PAD + reach, wx + width - PAD - reach)),
      y: round2(clamp(slot.y + jitter(rng, WOBBLE), wy + PAD + reach, wy + height - PAD - reach)),
      rotation: round2(jitter(rng, 3)),
      scale: round2(slot.scale),
      z: rank,
    };
  });
};
