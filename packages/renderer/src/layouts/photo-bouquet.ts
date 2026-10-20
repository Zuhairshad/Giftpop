import { clamp, clampToScene, round2 } from "./geometry";
import { createRng, jitter, shuffleInPlace } from "./prng";
import { expandDesignItems, type LayoutFn, type Placement } from "./types";

/** Where every stem gathers, at the top of the paper cone. Shared with the art: change both together. */
export const PHOTO_BOUQUET_GATHER = Object.freeze({ x: 500, y: 700 });

/** The highest item sits here; the lowest an item centre may be is MAX_Y (the cone starts near 660). */
const TOP = { x: 500, y: 240 };
const MAX_Y = 580;

interface Slot {
  x: number;
  y: number;
}

/** `count` points along the upper half of an ellipse, left to right, from `from` degrees above the horizontal. */
function arc(count: number, cx: number, cy: number, rx: number, ry: number, from: number): Slot[] {
  const left = 180 - from;
  return Array.from({ length: count }, (_, k) => {
    const deg = count === 1 ? 90 : left + ((from - left) * k) / (count - 1);
    const rad = (deg * Math.PI) / 180;
    return { x: cx + rx * Math.cos(rad), y: cy - ry * Math.sin(rad) };
  });
}

/** Dome slots: one item on top, the rest in one arc below it, or in an outer and an inner arc. */
function domeSlots(count: number): Slot[] {
  if (count === 1) return [TOP];
  const rest = count - 1;
  if (rest <= 5) return [TOP, ...arc(rest, 500, 530, 260, 220, 15)];
  const outer = Math.ceil(rest * 0.6);
  return [TOP, ...arc(outer, 500, 540, 320, 270, 8), ...arc(rest - outer, 500, 560, 170, 150, 30)];
}

/**
 * Items as a hand-tied bouquet of picks: one stands highest at the centre and the rest ring below
 * it in a rounded dome, all stems gathering at the wrap. Which item takes which slot is shuffled
 * by the seed, as is a small wobble. Lower items paint in front. Pure and deterministic.
 */
export const photoBouquet: LayoutFn = ({ design }) => {
  const count = expandDesignItems(design).length;
  if (count === 0) return [];

  const rng = createRng(design.arrangementSeed);
  const scale = clamp(1.12 - count * 0.055, 0.6, 1);
  const slots = domeSlots(count);

  shuffleInPlace(rng, slots);

  const placed = slots.map((slot, itemIndex) => {
    const x = clampToScene(slot.x + jitter(rng, 8));
    const y = Math.min(clampToScene(slot.y + jitter(rng, 8)), MAX_Y);
    return {
      itemIndex,
      x: round2(x),
      y: round2(y),
      rotation: round2(((x - 500) / 500) * 16 + jitter(rng, 4)),
      scale: round2(scale),
    };
  });

  // Paint order: higher on the dome first, so the lower ring overlaps it.
  const byHeight = [...placed].sort((a, b) => a.y - b.y || a.itemIndex - b.itemIndex);
  const zOf = new Map(byHeight.map((p, rank) => [p.itemIndex, rank]));
  return placed.map((p): Placement => ({ ...p, z: zOf.get(p.itemIndex) ?? 0 }));
};
