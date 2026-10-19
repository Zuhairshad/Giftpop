import { useId } from "react";

import { GOLD, ROUND } from "../palette";
import { roundRectPath } from "../parts/shapes";
import type { PackagingIllustrationProps } from "../types";

import { Bow } from "./Bow";
import { boxTones, ribbonTones, wrapTones } from "./tones";

/** Outer rim (lid lip) with the opening cut out, as one even-odd path. */
const RIM = `${roundRectPath(80, 64, 840, 846, 30)}${roundRectPath(140, 140, 720, 722, 12)}`;
const OPENING = roundRectPath(140, 140, 720, 722, 12);
const FACE = "M80 880H920V912A28 28 0 0 1 892 940H108A28 28 0 0 1 80 912Z";

/** Over the items: the lid rim, the front wall, a ribbon band over the edges and a small bow. */
export function BoxGridFront({ wrapper, ribbon }: PackagingIllustrationProps) {
  const t = wrapTones(wrapper);
  const box = boxTones(wrapper);
  const r = ribbonTones(ribbon);
  const patternId = `box-dots-${useId().replace(/:/g, "")}`;
  const stroke = { stroke: box.edge, strokeWidth: 7, ...ROUND } as const;
  const band = { fill: r.fill, stroke: r.edge, strokeWidth: 5, ...ROUND } as const;
  return (
    <g data-art="front">
      <defs>
        <pattern id={patternId} width="56" height="56" patternUnits="userSpaceOnUse">
          <circle cx="10" cy="12" r="4.5" fill="#fff" />
          <circle cx="38" cy="40" r="4.5" fill="#fff" />
        </pattern>
      </defs>
      <path d={FACE} fill={box.face} {...stroke} />
      <path d={FACE} fill={`url(#${patternId})`} opacity="0.22" />
      <path d={RIM} fillRule="evenodd" fill={t.base} {...stroke} />
      <path d={RIM} fillRule="evenodd" fill={`url(#${patternId})`} opacity="0.22" />
      <path d={OPENING} fill="none" stroke={t.lit} strokeWidth="8" opacity="0.8" {...ROUND} />
      <path d={OPENING} fill="none" stroke={box.edge} strokeWidth="5" {...ROUND} />
      {/* The one highlight stripe, along the top lip. */}
      <path d="M118 100H420" stroke="#fff" strokeWidth="10" opacity="0.5" {...ROUND} />
      <path d="M104 880H896" stroke={box.edge} strokeWidth="5" opacity="0.45" {...ROUND} />
      <rect x="462" y="64" width="76" height="76" {...band} />
      <path d="M470 66V138M530 66V138" stroke={GOLD} strokeWidth="2.5" opacity="0.9" />
      <rect x="462" y="862" width="76" height="78" {...band} />
      <path d="M470 864V938M530 864V938" stroke={GOLD} strokeWidth="2.5" opacity="0.9" />
      <rect x="470" y="868" width="8" height="66" rx="4" fill={r.light} opacity="0.55" />
      <g transform="translate(500 896)">
        <Bow ribbon={ribbon} scale={0.62} />
      </g>
    </g>
  );
}
