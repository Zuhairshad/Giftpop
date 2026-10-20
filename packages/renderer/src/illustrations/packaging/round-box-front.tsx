import { useId } from "react";

import { GOLD, ROUND } from "../palette";
import type { PackagingIllustrationProps } from "../types";

import { Bow } from "./Bow";
import {
  arcY,
  BASE_Y,
  DRUM_FACE,
  drumBand,
  drumStrip,
  FRONT_RIM,
  OPEN,
  tissue,
} from "./round-box-shape";
import { boxTones, ribbonTones, wrapTones } from "./tones";

const FRONT_TISSUE = tissue("front", 22, 36, 8);
const BAND_TOP = 618;
const BAND_BOTTOM = 664;
const BOW_X = 404;

/** Over the items: tissue tucked along the front rim, the drum wall, the ribbon band and a bow. */
export function RoundBoxFront({ wrapper, ribbon }: PackagingIllustrationProps) {
  const t = wrapTones(wrapper);
  const box = boxTones(wrapper);
  const r = ribbonTones(ribbon);
  const patternId = `hat-dots-${useId().replace(/:/g, "")}`;
  const stroke = { stroke: box.edge, strokeWidth: 6, ...ROUND } as const;
  const bandEdge = (cy: number) =>
    `M${OPEN.cx - OPEN.rx} ${cy}A${OPEN.rx} ${OPEN.ry} 0 0 0 ${OPEN.cx + OPEN.rx} ${cy}`;
  const bowY = (arcY(BOW_X, BAND_TOP, "front") + arcY(BOW_X, BAND_BOTTOM, "front")) / 2;
  return (
    <g data-art="front">
      <defs>
        <pattern id={patternId} width="56" height="56" patternUnits="userSpaceOnUse">
          <circle cx="10" cy="12" r="4.5" fill="#fff" />
          <circle cx="38" cy="40" r="4.5" fill="#fff" />
        </pattern>
      </defs>
      <path d={FRONT_TISSUE.d} fill={box.tissue} stroke={box.edge} strokeWidth="4" {...ROUND} />
      <path
        d={FRONT_TISSUE.points
          .slice(1, -1)
          .map(([x, y]) => `M${x} ${y + 8}Q${x - 6} ${y + 24} ${x + 2} ${y + 40}`)
          .join("")}
        fill="none"
        stroke={box.crease}
        strokeWidth="4"
        opacity="0.8"
        {...ROUND}
      />
      <path d={DRUM_FACE} fill={t.base} {...stroke} />
      <path d={drumStrip(690, OPEN.cx + OPEN.rx)} fill={t.back} opacity="0.55" />
      <path d={drumStrip(OPEN.cx - OPEN.rx, 236)} fill={t.back} opacity="0.3" />
      <path d={DRUM_FACE} fill={`url(#${patternId})`} opacity="0.22" />
      <path
        d={`M262 ${arcY(262, OPEN.cy, "front") + 40}V${arcY(262, BASE_Y, "front") - 46}`}
        stroke="#fff"
        strokeWidth="12"
        opacity="0.42"
        {...ROUND}
      />
      <path
        d={drumBand(BAND_TOP, BAND_BOTTOM)}
        fill={r.fill}
        stroke={r.edge}
        strokeWidth="5"
        {...ROUND}
      />
      <path d={bandEdge(BAND_TOP + 8)} fill="none" stroke={GOLD} strokeWidth="2.5" opacity="0.9" />
      <path
        d={bandEdge(BAND_BOTTOM - 8)}
        fill="none"
        stroke={GOLD}
        strokeWidth="2.5"
        opacity="0.9"
      />
      <path
        d={bandEdge(BAND_TOP + 18)}
        fill="none"
        stroke={r.light}
        strokeWidth="5"
        opacity="0.4"
        {...ROUND}
      />
      <path d={DRUM_FACE} fill="none" {...stroke} />
      <path d={FRONT_RIM} fill="none" stroke={t.lit} strokeWidth="14" {...ROUND} />
      <path d={FRONT_RIM} fill="none" stroke={box.edge} strokeWidth="5" {...ROUND} />
      <g transform={`translate(${BOW_X} ${bowY}) rotate(-6)`}>
        <Bow ribbon={ribbon} scale={0.7} />
      </g>
    </g>
  );
}
