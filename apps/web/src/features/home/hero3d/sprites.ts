import type { ItemShape } from "@giftpop/contracts";

import { PALETTE } from "./constants";

export interface SpriteDef {
  id: string;
  kind: "item" | "sticker";
  shape?: ItemShape;
  color: string;
  /** Resting spot in poster pixels (y down), scale of the 200 px art, rotation in degrees (clockwise). */
  x: number;
  y: number;
  scale: number;
  rotDeg: number;
  /** Depth in front of the box centre. In-box items sit near 0 so the front wall hides their feet. */
  z: number;
  /** Position in the burst; 0 flies first. */
  burst: number;
  /** Starts inside the box and settles into it, rather than flying out. */
  inBox: boolean;
  /** Extra height of the ballistic arc, world units. */
  arc: number;
  /** Spin in degrees at launch, easing to zero. */
  spinDeg: number;
  /** Phase offset of the idle float, 0..1. */
  phase: number;
}

type SpriteSeed = Omit<SpriteDef, "id" | "kind" | "burst" | "inBox">;

const item = (
  id: string,
  shape: ItemShape,
  burst: number,
  inBox: boolean,
  seed: SpriteSeed,
): SpriteDef => ({ id, kind: "item", shape, burst, inBox, ...seed });

/** The nine burst sprites: eight item illustrations and the die-cut sticker topper. */
export const SPRITES: readonly SpriteDef[] = [
  item("soft-toy", "soft-toy", 0, true, {
    color: "#D9A877",
    x: 392,
    y: 300,
    scale: 1.2,
    rotDeg: 4,
    z: -1,
    arc: 0.5,
    spinDeg: 40,
    phase: 0.1,
  }),
  item("bottle", "bottle", 1, true, {
    color: "#B9A6D8",
    x: 298,
    y: 308,
    scale: 1,
    rotDeg: -8,
    z: -0.95,
    arc: 0.6,
    spinDeg: -60,
    phase: 0.35,
  }),
  item("jar", "jar", 2, true, {
    color: "#F6C7D8",
    x: 480,
    y: 318,
    scale: 0.92,
    rotDeg: 9,
    z: -0.9,
    arc: 0.6,
    spinDeg: 70,
    phase: 0.6,
  }),
  {
    id: "sticker",
    kind: "sticker",
    color: "#FFC2D8",
    x: 138,
    y: 150,
    scale: 1,
    rotDeg: -10,
    z: 1,
    burst: 3,
    inBox: false,
    arc: 1.2,
    spinDeg: -80,
    phase: 0.8,
  },
  item("balloon", "balloon", 4, false, {
    color: "#E8467C",
    x: 592,
    y: 112,
    scale: 1.1,
    rotDeg: 12,
    z: 0.4,
    arc: 1.6,
    spinDeg: 50,
    phase: 0.2,
  }),
  item("flower-pink", "flower", 5, false, {
    color: "#F2709C",
    x: 578,
    y: 272,
    scale: 0.8,
    rotDeg: 18,
    z: 0.5,
    arc: 1.3,
    spinDeg: 90,
    phase: 0.5,
  }),
  item("mug", "mug", 6, false, {
    color: "#FFFFFF",
    x: 606,
    y: 446,
    scale: 0.9,
    rotDeg: 12,
    z: 0.5,
    arc: 1.1,
    spinDeg: -70,
    phase: 0.7,
  }),
  item("bar", "bar", 7, false, {
    color: "#7B4A2D",
    x: 128,
    y: 420,
    scale: 0.95,
    rotDeg: -26,
    z: 0.5,
    arc: 1.1,
    spinDeg: 80,
    phase: 0.9,
  }),
  item("flower-red", "flower", 8, false, {
    color: "#D6243C",
    x: 130,
    y: 264,
    scale: 0.76,
    rotDeg: -18,
    z: 0.5,
    arc: 1.3,
    spinDeg: -90,
    phase: 0.05,
  }),
];

/** The sticker art box relative to the sticker's origin, poster pixels. Items use the 200 px box. */
export const STICKER_ART = { x: -75, y: -45, w: 150, h: 190 } as const;
export const ITEM_ART_BOX = { x: -100, y: -100, w: 200, h: 200 } as const;

export interface SparkleDef {
  id: string;
  kind: "star" | "dot";
  color: string;
  x: number;
  y: number;
  /** Radius in poster pixels. */
  size: number;
}

export const SPARKLES: readonly SparkleDef[] = [
  { id: "s1", kind: "star", color: PALETTE.gold, x: 236, y: 70, size: 18 },
  { id: "s2", kind: "star", color: PALETTE.gold, x: 520, y: 44, size: 18 },
  { id: "s3", kind: "star", color: PALETTE.gold, x: 690, y: 330, size: 15.6 },
  { id: "s4", kind: "star", color: "#FFFFFF", x: 86, y: 330, size: 13.2 },
  { id: "s5", kind: "star", color: PALETTE.gold, x: 80, y: 150, size: 15.6 },
  { id: "d1", kind: "dot", color: PALETTE.lavender, x: 402, y: 30, size: 6 },
  { id: "d2", kind: "dot", color: PALETTE.lavender, x: 676, y: 560, size: 5 },
];
