import { shade } from "../../placeholders/color";
import { ROUND } from "../palette";
import { roundRectPath } from "../parts/shapes";
import type { PackagingIllustrationProps } from "../types";

import { wrapTones } from "./tones";

/** The box interior seen from slightly above: floor, back wall, side walls and a little tissue. */
export function BoxGridBack({ wrapper }: PackagingIllustrationProps) {
  const t = wrapTones(wrapper);
  const side = shade(t.floor, -0.15);
  return (
    <g data-art="back">
      <ellipse cx="500" cy="950" rx="400" ry="20" fill="#2B1733" opacity="0.16" />
      <ellipse cx="500" cy="948" rx="330" ry="10" fill="#2B1733" opacity="0.14" />
      <path
        d={roundRectPath(126, 126, 748, 750, 14)}
        fill={t.floor}
        stroke={t.edge}
        strokeWidth="5"
        {...ROUND}
      />
      <path d="M126 126H874L850 200H150Z" fill={t.back} />
      <path d="M126 126L150 200V876H126Z" fill={side} />
      <path d="M874 126L850 200V876H874Z" fill={side} />
      <path d="M150 200H850" stroke={t.edge} strokeWidth="4" opacity="0.5" {...ROUND} />
      <path d="M170 150H830" stroke="#fff" strokeWidth="6" opacity="0.18" {...ROUND} />
      <path
        d="M150 846Q190 826 228 846Q268 826 306 846Q346 826 384 846Q424 826 462 846Q502 826 540 846Q580 826 618 846Q658 826 696 846Q736 826 774 846Q812 826 850 846V876H150Z"
        fill={t.back}
        opacity="0.8"
      />
      <g fill="#fff" opacity="0.1">
        <circle cx="220" cy="300" r="18" />
        <circle cx="780" cy="420" r="22" />
        <circle cx="300" cy="700" r="20" />
        <circle cx="720" cy="760" r="16" />
      </g>
    </g>
  );
}
