import { ROUND } from "../palette";
import type { PackagingIllustrationProps } from "../types";

import { ruffleEdge } from "./ruffle";
import { wrapTones } from "./tones";

/** Where the layout gathers the stems (see `layouts/bouquet-fan.ts`) and where the paper tapers to. */
const GATHER = { x: 500, y: 860 };
const TIP = { x: 500, y: 935 };

/** A circular crinkled edge about the gather point: radius `r`, reaching `deg` degrees either side. */
function paperLayer(r: number, deg: number, bumps: number, amp: number) {
  const half = r * Math.sin((deg * Math.PI) / 180);
  const yAt = (t: number) => {
    const dx = (2 * t - 1) * half;
    return GATHER.y - Math.sqrt(r * r - dx * dx);
  };
  const edge = ruffleEdge(GATHER.x - half, GATHER.x + half, yAt, bumps, amp);
  const first = edge.points[0] ?? [GATHER.x, GATHER.y - r];
  const d = `M${TIP.x} ${TIP.y}L${first[0]} ${first[1]}${edge.d}Z`;
  const pleats = edge.points
    .slice(1, -1)
    .map(([x, y]) => `M${TIP.x} ${TIP.y - 8}L${x} ${y + 14}`)
    .join("");
  return { d, pleats, start: first };
}

/** Behind the items: ground shadow and two layers of pleated, crinkle-edged paper. */
export function BouquetFanBack({ wrapper }: PackagingIllustrationProps) {
  const t = wrapTones(wrapper);
  const outer = paperLayer(432, 56, 11, 16);
  const inner = paperLayer(380, 51, 9, 13);
  const stroke = { stroke: t.edge, strokeWidth: 5, ...ROUND } as const;
  return (
    <g data-art="back">
      <ellipse cx="500" cy="944" rx="170" ry="16" fill="#2B1733" opacity="0.18" />
      <ellipse cx="500" cy="944" rx="250" ry="26" fill="#2B1733" opacity="0.07" />
      <path d={outer.d} fill={t.back} {...stroke} />
      <path
        d={outer.pleats}
        fill="none"
        stroke={t.fold}
        strokeWidth="3"
        opacity="0.22"
        {...ROUND}
      />
      <path d={inner.d} fill={t.mid} {...stroke} strokeWidth="4" />
      <path
        d={inner.pleats}
        fill="none"
        stroke={t.fold}
        strokeWidth="2.5"
        opacity="0.2"
        {...ROUND}
      />
      <path
        d="M206 640Q226 592 290 560"
        fill="none"
        stroke="#fff"
        strokeWidth="8"
        opacity="0.3"
        {...ROUND}
      />
    </g>
  );
}
