import { SNACK_HAMPER } from "../../layouts/snack-hamper";
import { INK, ROUND } from "../palette";
import type { PackagingIllustrationProps } from "../types";

import { boxTones, wrapTones } from "./tones";

const { innerLeft: L, innerRight: R, rimY } = SNACK_HAMPER;

/** Shredded-paper strands in the crate: start x, height of the crest, sway. Deterministic. */
const STRANDS = [
  [250, 560, 18],
  [305, 540, -16],
  [360, 575, 20],
  [415, 545, -14],
  [470, 570, 16],
  [530, 548, -18],
  [585, 574, 14],
  [640, 542, -20],
  [695, 566, 18],
  [748, 552, -14],
] as const;

function strandPath([x, y, sway]: readonly [number, number, number]): string {
  return `M${x} ${rimY + 6}C${x + sway} ${y + 70} ${x - sway} ${y + 30} ${x + sway * 0.6} ${y}`;
}

/** Behind the items: ground shadow, the crate's inside walls with slats, and the paper filler. */
export function SnackHamperBack({ wrapper }: PackagingIllustrationProps) {
  const t = wrapTones(wrapper);
  const box = boxTones(wrapper);
  const line = { stroke: box.edge, strokeWidth: 4, ...ROUND } as const;
  return (
    <g data-art="back">
      <ellipse cx="500" cy="915" rx="400" ry="24" fill={INK} opacity="0.16" />
      <ellipse cx="500" cy="908" rx="330" ry="12" fill={INK} opacity="0.14" />
      <path d={`M190 440H810L${R + 25} ${rimY}H${L - 25}Z`} fill={box.wall} {...line} />
      <path
        d="M200 500H800M208 548H792M216 596H784"
        stroke={box.edge}
        strokeWidth="3"
        opacity="0.4"
      />
      <path d={`M190 440L130 ${rimY}H${L}L205 450Z`} fill={box.side} {...line} />
      <path d={`M810 440L870 ${rimY}H${R}L795 450Z`} fill={box.side} {...line} />
      <path d="M170 440H830" stroke={t.lit} strokeWidth="18" opacity="0.9" {...ROUND} />
      <path d={`M${L} 540H${R}V${rimY + 10}H${L}Z`} fill={box.tissue} />
      <g fill="none" stroke={box.crease} strokeWidth="9" {...ROUND}>
        {STRANDS.map((s) => (
          <path key={s[0]} d={strandPath(s)} />
        ))}
      </g>
      <path
        d={`M${L} 560Q500 520 ${R} 560`}
        fill="none"
        stroke={box.dots}
        strokeWidth="4"
        opacity="0.35"
        {...ROUND}
      />
    </g>
  );
}
