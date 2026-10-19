import { useId } from "react";

import { shade } from "../../placeholders/color";
import { GOLD, GOLD_DARK, ROUND } from "../palette";
import type { PackagingIllustrationProps } from "../types";

import { Bow } from "./Bow";
import { ruffleEdge } from "./ruffle";
import { wrapTones } from "./tones";

// Panel tops lie on a circle of radius 300 about the stems' gather point (500, 860).
const LEFT = "M500 940L277 660A300 300 0 0 1 427 569Z";
const CENTER = "M500 944L427 569A300 300 0 0 1 573 569Z";
const RIGHT = "M500 940L723 660A300 300 0 0 0 573 569Z";

/** A folded-over cuff of crinkled paper along the panel tops: scalloped outside, plain arc inside. */
const CUFF = (() => {
  const r = 306;
  const half = 227;
  const edge = ruffleEdge(
    500 - half,
    500 + half,
    (u) => 860 - Math.sqrt(r * r - ((2 * u - 1) * half) ** 2),
    8,
    10,
  );
  const [x, y] = edge.points[0] ?? [273, 660];
  return `M${x} ${y}${edge.d}L702 678A272 272 0 0 0 298 678Z`;
})();

/** Over the items: three cellophane panels with sheen, fold lines and dots, the twine and the bow. */
export function BouquetFanFront({ wrapper, ribbon }: PackagingIllustrationProps) {
  const t = wrapTones(wrapper);
  const patternId = `fan-dots-${useId().replace(/:/g, "")}`;
  const stroke = { stroke: t.edge, strokeWidth: 5, ...ROUND } as const;
  return (
    <g data-art="front">
      <defs>
        <pattern id={patternId} width="64" height="64" patternUnits="userSpaceOnUse">
          <circle cx="12" cy="14" r="5" fill="#fff" />
          <circle cx="44" cy="46" r="5" fill="#fff" />
        </pattern>
      </defs>
      <path d={LEFT} fill={t.lit} {...stroke} />
      <path d={RIGHT} fill={t.mid} {...stroke} />
      <path d={CENTER} fill={t.base} {...stroke} />
      {[LEFT, RIGHT, CENTER].map((d) => (
        <path key={d} d={d} fill={`url(#${patternId})`} opacity="0.3" />
      ))}
      <path d={CUFF} fill={t.lit} {...stroke} strokeWidth="4" />
      <path d={CUFF} fill={`url(#${patternId})`} opacity="0.25" />
      <path
        d="M338 690L420 820"
        fill="none"
        stroke="#fff"
        strokeWidth="14"
        opacity="0.28"
        {...ROUND}
      />
      <path
        d="M664 700L590 810"
        fill="none"
        stroke="#fff"
        strokeWidth="8"
        opacity="0.2"
        {...ROUND}
      />
      <path
        d="M500 930L330 680M500 930L452 600M500 930L548 600M500 930L670 680"
        fill="none"
        stroke={t.fold}
        strokeWidth="3"
        opacity="0.3"
        {...ROUND}
      />
      <path
        d="M384 792Q500 822 616 792"
        fill="none"
        stroke={GOLD_DARK}
        strokeWidth="10"
        {...ROUND}
      />
      <path
        d="M384 790Q500 820 616 790"
        fill="none"
        stroke={shade(GOLD, 0.1)}
        strokeWidth="5"
        {...ROUND}
      />
      <g transform="translate(500 790)">
        <Bow ribbon={ribbon} scale={0.9} />
      </g>
    </g>
  );
}
