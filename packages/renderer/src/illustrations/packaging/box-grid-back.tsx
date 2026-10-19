import { ROUND } from "../palette";
import { Dots } from "../parts/Dots";
import { roundRectPath } from "../parts/shapes";
import type { PackagingIllustrationProps } from "../types";

import { boxTones } from "./tones";

/** Crinkled tissue tucked along the front of the floor. */
const TUCK_EDGE =
  "M150 846Q190 826 228 846Q268 826 306 846Q346 826 384 846Q424 826 462 846Q502 826 540 846Q580 826 618 846Q658 826 696 846Q736 826 774 846Q812 826 850 846";
const TUCK = `${TUCK_EDGE}V876H150Z`;

const TISSUE_DOTS = [
  [236, 300],
  [770, 268],
  [520, 470],
  [290, 640],
  [728, 610],
  [460, 780],
] as const;

/**
 * The box interior seen from slightly above: a tissue-lined floor, a back wall and two side walls
 * in shadow, a few creases and texture dots.
 */
export function BoxGridBack({ wrapper }: PackagingIllustrationProps) {
  const t = boxTones(wrapper);
  return (
    <g data-art="back">
      <ellipse cx="500" cy="950" rx="400" ry="20" fill="#2B1733" opacity="0.16" />
      <ellipse cx="500" cy="948" rx="330" ry="10" fill="#2B1733" opacity="0.14" />
      <path
        d={roundRectPath(126, 126, 748, 750, 14)}
        fill={t.tissue}
        stroke={t.edge}
        strokeWidth="6"
        {...ROUND}
      />
      <path d="M126 126H874L850 200H150Z" fill={t.wall} />
      <path d="M126 126L150 200V876H126Z" fill={t.side} />
      <path d="M874 126L850 200V876H874Z" fill={t.side} />
      <path d="M150 200H850" stroke={t.edge} strokeWidth="5" opacity="0.6" {...ROUND} />
      <path
        d="M168 226Q236 262 262 346M832 226Q764 262 738 346M190 800Q270 770 350 796"
        fill="none"
        stroke={t.crease}
        strokeWidth="6"
        opacity="0.5"
        {...ROUND}
      />
      <Dots at={TISSUE_DOTS} color={t.dots} r={10} opacity={0.35} />
      <path d={TUCK} fill={t.crease} opacity="0.9" />
      <path d={TUCK_EDGE} fill="none" stroke={t.edge} strokeWidth="4" opacity="0.35" {...ROUND} />
    </g>
  );
}
