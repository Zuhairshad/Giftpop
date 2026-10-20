import { ROUND_BOX_OPENING } from "../../layouts/round-box";

import { ruffleEdge } from "./ruffle";

/** The drum: its opening is the layout's, its base the same ellipse lower down. */
export const OPEN = ROUND_BOX_OPENING;
export const BASE_Y = 745;
const LEFT = OPEN.cx - OPEN.rx;
const RIGHT = OPEN.cx + OPEN.rx;

const r1 = (n: number) => Math.round(n * 10) / 10;

/** Height of the near (front) or far (back) half of a drum ellipse centred at `cy`, at `x`. */
export function arcY(x: number, cy: number, side: "front" | "back"): number {
  const u = (x - OPEN.cx) / OPEN.rx;
  const h = OPEN.ry * Math.sqrt(Math.max(0, 1 - u * u));
  return side === "front" ? cy + h : cy - h;
}

/** The drum's outside wall, from the opening's front rim down to its base. */
export const DRUM_FACE =
  `M${LEFT} ${OPEN.cy}V${BASE_Y}A${OPEN.rx} ${OPEN.ry} 0 0 0 ${RIGHT} ${BASE_Y}` +
  `V${OPEN.cy}A${OPEN.rx} ${OPEN.ry} 0 0 1 ${LEFT} ${OPEN.cy}Z`;

export const FRONT_RIM = `M${LEFT} ${OPEN.cy}A${OPEN.rx} ${OPEN.ry} 0 0 0 ${RIGHT} ${OPEN.cy}`;
export const BACK_RIM = `M${LEFT} ${OPEN.cy}A${OPEN.rx} ${OPEN.ry} 0 0 1 ${RIGHT} ${OPEN.cy}`;

/** A band around the drum between heights `top` and `bottom` (centre heights of its ellipses). */
export function drumBand(top: number, bottom: number): string {
  return (
    `M${LEFT} ${top}A${OPEN.rx} ${OPEN.ry} 0 0 0 ${RIGHT} ${top}` +
    `V${bottom}A${OPEN.rx} ${OPEN.ry} 0 0 1 ${LEFT} ${bottom}Z`
  );
}

/** A strip of the drum wall from x0 to x1 (for the shaded side), following the curved rim and base. */
export function drumStrip(x0: number, x1: number): string {
  const steps = 8;
  const top: string[] = [];
  const bottom: string[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const x = x0 + ((x1 - x0) * i) / steps;
    top.push(`${r1(x)} ${r1(arcY(x, OPEN.cy, "front"))}`);
    bottom.push(`${r1(x)} ${r1(arcY(x, BASE_Y, "front"))}`);
  }
  return `M${top.join("L")}L${bottom.reverse().join("L")}Z`;
}

/**
 * Crinkled tissue along one half of the rim: scallops rising `lift` above the rim, closed back
 * along the rim itself (front) or down into the box (back), so it reads as paper tucked inside.
 */
export function tissue(side: "front" | "back", inset: number, lift: number, bumps: number) {
  const x0 = LEFT + inset;
  const x1 = RIGHT - inset;
  const edge = ruffleEdge(
    x0,
    x1,
    (t) => arcY(x0 + (x1 - x0) * t, OPEN.cy, side) - lift,
    bumps,
    lift * 0.7,
  );
  const [sx, sy] = edge.points[0] ?? [x0, OPEN.cy];
  const close =
    side === "front"
      ? `L${r1(x1)} ${r1(arcY(x1, OPEN.cy, "front"))}A${OPEN.rx} ${OPEN.ry} 0 0 1 ${r1(x0)} ${r1(arcY(x0, OPEN.cy, "front"))}Z`
      : `L${r1(x1)} ${OPEN.cy + 40}Q${OPEN.cx} ${OPEN.cy + 80} ${r1(x0)} ${OPEN.cy + 40}Z`;
  return { d: `M${sx} ${sy}${edge.d}${close}`, points: edge.points };
}
