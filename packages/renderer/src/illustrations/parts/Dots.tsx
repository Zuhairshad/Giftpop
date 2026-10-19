/** A few texture dots at 25% opacity, given as `[x, y]` pairs. */
export function Dots({
  at,
  color,
  r = 2,
  opacity = 0.25,
}: {
  at: ReadonlyArray<readonly [number, number]>;
  color: string;
  r?: number;
  opacity?: number;
}) {
  return (
    <g fill={color} opacity={opacity}>
      {at.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={r} />
      ))}
    </g>
  );
}

/** One highlight stripe: a rounded bar in the lightened fill at 55% opacity. */
export function Stripe({
  x,
  y,
  height,
  color,
  width = 7,
  opacity = 0.55,
}: {
  x: number;
  y: number;
  height: number;
  color: string;
  width?: number;
  opacity?: number;
}) {
  return (
    <rect x={x} y={y} width={width} height={height} rx={width / 2} fill={color} opacity={opacity} />
  );
}
