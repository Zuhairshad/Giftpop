import type { ItemPalette } from "../palette";

export type Stops = ReadonlyArray<readonly [number, string]>;

/** A linear gradient; the default runs left to right across the shape's own box. */
export function Linear({
  id,
  stops,
  x2 = 1,
  y2 = 0,
}: {
  id: string;
  stops: Stops;
  x2?: number;
  y2?: number;
}) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2={x2} y2={y2}>
      {stops.map(([offset, color]) => (
        <stop key={offset} offset={offset} stopColor={color} />
      ))}
    </linearGradient>
  );
}

/**
 * A round body seen from the side, lit from the upper left: a dark turned-away edge, a bright
 * band a fifth of the way in, the fill across the middle and a deep shadow side on the right.
 */
export function cylinderStops(p: ItemPalette): Stops {
  return [
    [0, p.deep],
    [0.18, p.soft],
    [0.32, p.fill],
    [0.78, p.deep],
    [1, p.shadow],
  ];
}

/** The same turn for a fixed material colour set (metal, glass, wax). */
export function metalStops(light: string, mid: string, dark: string): Stops {
  return [
    [0, mid],
    [0.2, light],
    [0.42, mid],
    [0.85, dark],
    [1, mid],
  ];
}

/** A radial gradient in the art's own coordinates, centred on (cx, cy). */
export function Radial({
  id,
  stops,
  cx,
  cy,
  r,
}: {
  id: string;
  stops: Stops;
  cx: number;
  cy: number;
  r: number;
}) {
  return (
    <radialGradient id={id} gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={r}>
      {stops.map(([offset, color]) => (
        <stop key={offset} offset={offset} stopColor={color} />
      ))}
    </radialGradient>
  );
}

/** `url(#id)` for a fill or stroke. */
export function ref(id: string): string {
  return `url(#${id})`;
}
