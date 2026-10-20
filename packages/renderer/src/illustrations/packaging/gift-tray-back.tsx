import { GIFT_TRAY } from "../../layouts/gift-tray";
import { ROUND } from "../palette";
import type { PackagingIllustrationProps } from "../types";

import { boxTones, ribbonTones, wrapTones } from "./tones";

const { left, right, backY, frontY, bottomY } = GIFT_TRAY;
const SHADOW_COLOR = "#2B1733";
/** The opening is the rim inset a little, so a lip shows all round. */
const OPEN_LEFT = left + 14;
const OPEN_RIGHT = right - 14;
const WALL_BOTTOM = backY + 46;

const OPENING = `M${OPEN_LEFT} ${frontY + 6}V${backY + 36}Q${OPEN_LEFT} ${backY} ${OPEN_LEFT + 40} ${backY}H${OPEN_RIGHT - 40}Q${OPEN_RIGHT} ${backY} ${OPEN_RIGHT} ${backY + 36}V${frontY + 6}Z`;
const BACK_WALL = `M${OPEN_LEFT} ${WALL_BOTTOM}V${backY + 36}Q${OPEN_LEFT} ${backY} ${OPEN_LEFT + 40} ${backY}H${OPEN_RIGHT - 40}Q${OPEN_RIGHT} ${backY} ${OPEN_RIGHT} ${backY + 36}V${WALL_BOTTOM}Z`;
const SHADOW = `M${left + 10} ${bottomY - 20}H${right - 10}Q${right + 20} ${bottomY + 20} ${right - 40} ${bottomY + 30}H${left + 40}Q${left - 20} ${bottomY + 20} ${left + 10} ${bottomY - 20}Z`;
const CREASES = `M${OPEN_LEFT + 30} ${WALL_BOTTOM + 40}Q300 ${WALL_BOTTOM + 70} 420 ${WALL_BOTTOM + 44}M590 ${WALL_BOTTOM + 50}Q720 ${WALL_BOTTOM + 78} ${OPEN_RIGHT - 30} ${WALL_BOTTOM + 40}`;

/** A side handle: a rounded loop standing out from the rim, `dir` is -1 (left) or 1 (right). */
function handle(dir: -1 | 1): string {
  const x0 = dir < 0 ? left + 4 : right - 4;
  const out = x0 + dir * 52;
  const y0 = frontY - 58;
  const y1 = frontY + 26;
  return `M${x0} ${y0}H${out - dir * 18}Q${out} ${y0} ${out} ${y0 + 18}V${y1 - 18}Q${out} ${y1} ${out - dir * 18} ${y1}H${x0}`;
}

/** Behind the items: ground shadow, the two handles, the tray's rim, the back wall and the lined floor. */
export function GiftTrayBack({ wrapper, ribbon }: PackagingIllustrationProps) {
  const t = wrapTones(wrapper);
  const box = boxTones(wrapper);
  const r = ribbonTones(ribbon);
  return (
    <g data-art="back">
      <path d={SHADOW} fill={SHADOW_COLOR} opacity="0.1" />
      {([-1, 1] as const).map((dir) => (
        <g key={dir} fill="none" {...ROUND}>
          <path d={handle(dir)} stroke={box.edge} strokeWidth="30" />
          <path d={handle(dir)} stroke={t.mid} strokeWidth="20" />
          <path d={handle(dir)} stroke={t.lit} strokeWidth="5" opacity="0.8" />
        </g>
      ))}
      <rect
        x={left}
        y={backY - 14}
        width={right - left}
        height={frontY - backY + 24}
        rx="46"
        fill={t.lit}
        stroke={box.edge}
        strokeWidth="6"
        {...ROUND}
      />
      <path d={OPENING} fill={box.tissue} stroke={box.edge} strokeWidth="4" {...ROUND} />
      <path d={BACK_WALL} fill={box.wall} stroke={box.edge} strokeWidth="4" {...ROUND} />
      <path d={CREASES} fill="none" stroke={box.crease} strokeWidth="4" opacity="0.7" {...ROUND} />
      <path
        d={`M${OPEN_LEFT + 30} ${backY + 12}H${OPEN_RIGHT - 30}`}
        stroke={r.light}
        strokeWidth="5"
        opacity="0.35"
        {...ROUND}
      />
    </g>
  );
}
