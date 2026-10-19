import { GOLD } from "../palette";

import { ribbonTones } from "./tones";

/**
 * A real ribbon bow centred on (0, 0): two hollow loops with an inner shadow, a knot, two
 * notched tails and thin gold piping along the loops. About 280 wide at scale 1. The ribbon
 * colour is the only input; the piping is a fixed accent.
 */
export function Bow({ ribbon, scale = 1 }: { ribbon: string; scale?: number }) {
  const t = ribbonTones(ribbon);
  const line = { stroke: t.edge, strokeWidth: 4, strokeLinejoin: "round" } as const;
  return (
    <g transform={`scale(${scale})`}>
      <path
        d="M-6 10C-30 46-52 84-66 128L-46 116L-36 138C-22 98-10 58 2 20Z"
        fill={t.tail}
        {...line}
      />
      <path d="M6 10C34 46 58 80 76 120L54 112L50 136C32 98 14 58-2 20Z" fill={t.fill} {...line} />
      <path d="M0 0C-34-78-146-78-136-8C-130 40-48 38 0 0Z" fill={t.fill} {...line} />
      <path d="M-14-6C-40-48-106-50-104-16C-102 12-48 18-14-6Z" fill={t.inner} />
      <path d="M0 0C34-78 146-78 136-8C130 40 48 38 0 0Z" fill={t.fill} {...line} />
      <path d="M14-6C40-48 106-50 104-16C102 12 48 18 14-6Z" fill={t.inner} />
      <path
        d="M-118-30q26-22 62-10M118-30q-26-22-62-10"
        fill="none"
        stroke={t.light}
        strokeWidth="5"
        strokeLinecap="round"
        opacity="0.75"
      />
      <path
        d="M-124-22C-120 14-60 28-22 4M124-22C120 14 60 28 22 4"
        fill="none"
        stroke={GOLD}
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.9"
      />
      <rect x="-23" y="-23" width="46" height="46" rx="16" fill={t.tail} {...line} />
      <path
        d="M-11-11q9-7 20-2"
        fill="none"
        stroke={t.light}
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.8"
      />
    </g>
  );
}
