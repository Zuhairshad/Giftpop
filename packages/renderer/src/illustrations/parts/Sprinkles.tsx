import { GOLD, GREEN, HEART, PAPER } from "../palette";

/** Rainbow sprinkles over the frosting: x, y, angle, colour. Fixed colours, like real sprinkles. */
const BITS = [
  [66, 112, 30, HEART],
  [84, 116, -20, GOLD],
  [104, 118, 60, "#6EC1E4"],
  [126, 114, -40, GREEN],
  [140, 110, 15, PAPER],
  [78, 92, 70, "#6EC1E4"],
  [98, 96, -10, HEART],
  [120, 92, 40, GOLD],
  [92, 74, -50, GREEN],
  [112, 72, 20, PAPER],
] as const;

export function Sprinkles() {
  return (
    <g>
      {BITS.map(([x, y, angle, color]) => (
        <rect
          key={`${x}-${y}`}
          x={x - 4}
          y={y - 1.6}
          width="8"
          height="3.2"
          rx="1.6"
          fill={color}
          stroke="#00000033"
          strokeWidth="0.6"
          transform={`rotate(${angle} ${x} ${y})`}
        />
      ))}
    </g>
  );
}
