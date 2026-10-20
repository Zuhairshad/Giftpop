import { useId } from "react";

import { ROUND } from "../palette";
import type { PackagingIllustrationProps } from "../types";

import { OPEN, tissue } from "./round-box-shape";
import { boxTones, ribbonTones, wrapTones } from "./tones";

/** The lid's rim, seen from the front, below its top face (lid space: centred on the origin). */
const LID_RX = OPEN.rx + 8;
const LID_RY = OPEN.ry + 4;
const LID_DEPTH = 54;
const LID_SIDE = `M${-LID_RX} 0V${LID_DEPTH}A${LID_RX} ${LID_RY} 0 0 0 ${LID_RX} ${LID_DEPTH}V0Z`;

const BACK_TISSUE = tissue("back", 26, 26, 7);
const INNER_TISSUE = tissue("back", 70, 14, 6);

/** The lid, slid off and propped behind the box at a tilt: rim, dotted top, a ribbon strip. */
function Lid({ wrapper, ribbon, patternId }: PackagingIllustrationProps & { patternId: string }) {
  const t = wrapTones(wrapper);
  const box = boxTones(wrapper);
  const r = ribbonTones(ribbon);
  const stroke = { stroke: box.edge, strokeWidth: 6, ...ROUND } as const;
  return (
    <g transform="translate(668 372) rotate(-13)">
      <path d={LID_SIDE} fill={box.face} {...stroke} />
      <path d={`M-30 ${LID_RY - 2}V${LID_RY + LID_DEPTH - 4}H30V${LID_RY - 2}Z`} fill={r.fill} />
      <ellipse rx={LID_RX} ry={LID_RY} fill={t.base} {...stroke} />
      <ellipse rx={LID_RX} ry={LID_RY} fill={`url(#${patternId})`} opacity="0.22" />
      <path d={`M-30 ${-LID_RY}V${LID_RY}H30V${-LID_RY}Z`} fill={r.fill} opacity="0.95" />
      <path
        d={`M-30 ${-LID_RY + 2}V${LID_RY - 2}M30 ${-LID_RY + 2}V${LID_RY - 2}`}
        stroke={r.edge}
        strokeWidth="4"
      />
      <ellipse rx={LID_RX} ry={LID_RY} fill="none" {...stroke} />
      <path
        d="M-236-46Q-150-80-40-88"
        fill="none"
        stroke="#fff"
        strokeWidth="10"
        opacity="0.45"
        {...ROUND}
      />
    </g>
  );
}

/**
 * Behind the items: the ground shadow, the lid propped behind at a tilt, the drum's dark inside
 * and crinkled tissue rising from the back of the box.
 */
export function RoundBoxBack({ wrapper, ribbon }: PackagingIllustrationProps) {
  const box = boxTones(wrapper);
  const patternId = `hat-lid-dots-${useId().replace(/:/g, "")}`;
  return (
    <g data-art="back">
      <defs>
        <pattern id={patternId} width="56" height="56" patternUnits="userSpaceOnUse">
          <circle cx="10" cy="12" r="4.5" fill="#fff" />
          <circle cx="38" cy="40" r="4.5" fill="#fff" />
        </pattern>
      </defs>
      <ellipse cx="500" cy="838" rx="350" ry="24" fill="#2B1733" opacity="0.08" />
      <ellipse cx="500" cy="836" rx="290" ry="14" fill="#2B1733" opacity="0.16" />
      <Lid wrapper={wrapper} ribbon={ribbon} patternId={patternId} />
      <ellipse
        cx={OPEN.cx}
        cy={OPEN.cy}
        rx={OPEN.rx}
        ry={OPEN.ry}
        fill={box.wall}
        stroke={box.edge}
        strokeWidth="6"
      />
      <path d={BACK_TISSUE.d} fill={box.tissue} stroke={box.edge} strokeWidth="4" {...ROUND} />
      <path d={INNER_TISSUE.d} fill={box.crease} opacity="0.55" />
      <path
        d={BACK_TISSUE.points
          .slice(1, -1)
          .map(([x, y]) => `M${x} ${y + 6}Q${x + 8} ${y + 34} ${x - 4} ${y + 60}`)
          .join("")}
        fill="none"
        stroke={box.crease}
        strokeWidth="4"
        opacity="0.7"
        {...ROUND}
      />
    </g>
  );
}
