import type { ItemPalette } from "../palette";
import { ROUND } from "../palette";

import { Radial, ref } from "./gradients";
import { useArtId } from "./ids";

/** One petal pointing up from the origin, with a softly notched tip. */
function petalPath(length: number, width: number): string {
  const w = width / 2;
  return (
    `M0 0C${-w * 1.4} ${-length * 0.35} ${-w * 1.1} ${-length} ${-w * 0.3} ${-length}` +
    `Q0 ${-length * 0.94} ${w * 0.3} ${-length}C${w * 1.1} ${-length} ${w * 1.4} ${-length * 0.35} 0 0Z`
  );
}

/** Rings of petals, outermost first: count, length, width, start angle. */
const RINGS = [
  [6, 48, 40, 0],
  [5, 37, 35, 36],
  [4, 25, 28, 15],
] as const;

/**
 * A rose head seen face-on and tipped back a little: three rings of overlapping petals, dark at
 * their base and lit at their curled lips, around a tight spiral heart. Centred on (cx, cy).
 */
export function RoseHead({ p, cx, cy }: { p: ItemPalette; cx: number; cy: number }) {
  const outer = useArtId("rose-outer", p.fill);
  const inner = useArtId("rose-inner", p.fill);
  return (
    <g transform={`translate(${cx} ${cy}) scale(1 0.86)`}>
      <defs>
        <Radial
          id={outer}
          cx={0}
          cy={0}
          r={52}
          stops={[
            [0, p.shadow],
            [0.45, p.deep],
            [0.8, p.fill],
            [1, p.soft],
          ]}
        />
        <Radial
          id={inner}
          cx={0}
          cy={0}
          r={36}
          stops={[
            [0, p.shadow],
            [0.55, p.fill],
            [1, p.soft],
          ]}
        />
      </defs>
      {RINGS.map(([count, length, width, start], ring) =>
        Array.from({ length: count }, (_, i) => {
          const angle = start + (360 / count) * i;
          return (
            <path
              key={`${ring}-${angle}`}
              d={petalPath(length, width)}
              transform={`rotate(${angle})`}
              fill={ref(ring === 0 ? outer : inner)}
              stroke={p.dark}
              strokeWidth="2.2"
              {...ROUND}
            />
          );
        }),
      )}
      <circle r="9" fill={p.shadow} stroke={p.dark} strokeWidth="2" />
      <path
        d="M-5 2C-6 -6 6 -7 6 0C6 5 -1 6 -2 1"
        fill="none"
        stroke={p.dark}
        strokeWidth="2"
        {...ROUND}
      />
      <path
        d="M-30 -22Q-20 -34 -4 -36"
        fill="none"
        stroke={p.shine}
        strokeWidth="3"
        opacity="0.7"
        {...ROUND}
      />
    </g>
  );
}
