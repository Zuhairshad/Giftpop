import { useId } from "react";

import { ROUND } from "../palette";
import type { PackagingIllustrationProps } from "../types";

import { heartPath, WALL_DEPTH } from "./heart-box-shape";
import { boxTones, ribbonTones, wrapTones } from "./tones";

const RIM = heartPath();
const SHADOW_OUTER = heartPath({ scale: 1.08, dy: WALL_DEPTH + 22 });
const SHADOW_INNER = heartPath({ scale: 0.98, dy: WALL_DEPTH + 10 });
const WALL = heartPath({ scale: 0.93, dy: 8 });
const FLOOR = heartPath({ scale: 0.8, dy: 26 });
const LID_TOP = heartPath();
const LID_SIDE = heartPath({ dy: 30 });
const LID_RIBBON = "M444 330V680H556V330Z";
const LID_RIBBON_EDGES = "M444 330V680M556 330V680";
const LID_SHEEN = heartPath({ scale: 0.9, dy: -4 });
const LID_PLACEMENT = "translate(655 250) rotate(14) scale(0.78) translate(-500 -520)";
const SHADOW_COLOR = "#2B1733";
const EDGE_WIDTH = 6;

/** The lid, slid off and propped behind the box at a tilt: a heart with a ribbon strip. */
function Lid({ wrapper, ribbon }: PackagingIllustrationProps) {
  const t = wrapTones(wrapper);
  const box = boxTones(wrapper);
  const r = ribbonTones(ribbon);
  const id = useId().replace(/:/g, "");
  const stroke = { stroke: box.edge, strokeWidth: EDGE_WIDTH, ...ROUND } as const;
  return (
    <g transform={LID_PLACEMENT}>
      <clipPath id={`heart-lid-clip-${id}`}>
        <path d={LID_TOP} />
      </clipPath>
      <path d={LID_SIDE} fill={box.face} {...stroke} />
      <path d={LID_TOP} fill={t.base} />
      <g clipPath={`url(#heart-lid-clip-${id})`}>
        <path d={LID_RIBBON} fill={r.fill} opacity="0.95" />
        <path d={LID_RIBBON_EDGES} stroke={r.edge} strokeWidth="5" />
        <path
          d={LID_SHEEN}
          fill="none"
          stroke={t.lit}
          strokeWidth="8"
          opacity="0.5"
        />
      </g>
      <path d={LID_TOP} fill="none" {...stroke} />
      <path
        d="M262 450Q270 392 340 392"
        fill="none"
        stroke="#fff"
        strokeWidth="12"
        opacity="0.45"
        {...ROUND}
      />
    </g>
  );
}

/**
 * Behind the items: a soft ground shadow, the lid propped behind, then the heart's rim with its
 * dark inner wall and the tissue-lined floor.
 */
export function HeartBoxBack({ wrapper, ribbon }: PackagingIllustrationProps) {
  const t = wrapTones(wrapper);
  const box = boxTones(wrapper);
  return (
    <g data-art="back">
      <path d={SHADOW_OUTER} fill={SHADOW_COLOR} opacity="0.08" />
      <path d={SHADOW_INNER} fill={SHADOW_COLOR} opacity="0.14" />
      <Lid wrapper={wrapper} ribbon={ribbon} />
      <path d={RIM} fill={t.lit} stroke={box.edge} strokeWidth={EDGE_WIDTH} {...ROUND} />
      <path d={WALL} fill={box.wall} stroke={box.edge} strokeWidth="4" {...ROUND} />
      <path d={FLOOR} fill={box.tissue} stroke={box.crease} strokeWidth="4" {...ROUND} />
      <path
        d="M500 470Q470 540 500 610M410 440Q390 500 430 560M590 440Q610 500 570 560"
        fill="none"
        stroke={box.crease}
        strokeWidth="4"
        opacity="0.7"
        {...ROUND}
      />
    </g>
  );
}
