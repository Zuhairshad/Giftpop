/** Path data for a circle, so it can go through `ShadedPath` like any other outline. */
export function circlePath(cx: number, cy: number, r: number): string {
  return ellipsePath(cx, cy, r, r);
}

/** Path data for an axis-aligned ellipse. */
export function ellipsePath(cx: number, cy: number, rx: number, ry: number): string {
  return `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0z`;
}

/** Path data for a rounded rectangle with one corner radius. */
export function roundRectPath(x: number, y: number, w: number, h: number, r: number): string {
  return (
    `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}` +
    `A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}` +
    `V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`
  );
}

/** A small heart centred on the origin, about 24 wide, for labels and stickers. */
export const HEART_PATH =
  "M0 12C-18 1 -15 -13 -6 -13C-2 -13 0 -10 0 -9C0 -10 2 -13 6 -13C15 -13 18 1 0 12Z";
