import { ruffleEdge } from "./ruffle";

/** An opening seen from slightly above: an ellipse centred at (cx, cy). */
export interface Opening {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

const r1 = (n: number) => Math.round(n * 10) / 10;

/** Height of the near (front) or far (back) half of an ellipse like `open`, centred at `cy`, at `x`. */
export function ellipseY(open: Opening, x: number, cy: number, side: "front" | "back"): number {
  const u = (x - open.cx) / open.rx;
  const h = open.ry * Math.sqrt(Math.max(0, 1 - u * u));
  return side === "front" ? cy + h : cy - h;
}

/** The near half of the opening's rim, left to right. */
export function frontRim(open: Opening): string {
  return `M${open.cx - open.rx} ${open.cy}A${open.rx} ${open.ry} 0 0 0 ${open.cx + open.rx} ${open.cy}`;
}

/**
 * A wall that tapers from the opening down to a base ellipse (`base` gives its centre height and
 * radii), covering the near half of the opening's rim: a mug body, a basket side.
 */
export function taperedWall(open: Opening, base: { cy: number; rx: number; ry: number }): string {
  const tl = open.cx - open.rx;
  const tr = open.cx + open.rx;
  const bl = open.cx - base.rx;
  const br = open.cx + base.rx;
  return (
    `M${tl} ${open.cy}L${bl} ${base.cy}A${base.rx} ${base.ry} 0 0 0 ${br} ${base.cy}` +
    `L${tr} ${open.cy}A${open.rx} ${open.ry} 0 0 1 ${tl} ${open.cy}Z`
  );
}

/**
 * Crinkled tissue along one half of the rim: scallops rising `lift` above it, closed along the rim
 * (front) or down into the vessel (back), so it reads as paper tucked inside.
 */
export function rimTissue(
  open: Opening,
  side: "front" | "back",
  inset: number,
  lift: number,
  bumps: number,
) {
  const x0 = open.cx - open.rx + inset;
  const x1 = open.cx + open.rx - inset;
  const edge = ruffleEdge(
    x0,
    x1,
    (t) => ellipseY(open, x0 + (x1 - x0) * t, open.cy, side) - lift,
    bumps,
    lift * 0.7,
  );
  const [sx, sy] = edge.points[0] ?? [x0, open.cy];
  const close =
    side === "front"
      ? `L${r1(x1)} ${r1(ellipseY(open, x1, open.cy, "front"))}A${open.rx} ${open.ry} 0 0 1 ${r1(x0)} ${r1(ellipseY(open, x0, open.cy, "front"))}Z`
      : `L${r1(x1)} ${open.cy + 40}Q${open.cx} ${open.cy + 80} ${r1(x0)} ${open.cy + 40}Z`;
  return { d: `M${sx} ${sy}${edge.d}${close}`, points: edge.points };
}
