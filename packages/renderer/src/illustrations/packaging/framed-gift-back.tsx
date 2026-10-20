import {
  FRAMED_GIFT_FRAME as F,
  FRAMED_GIFT_HANGER,
  FRAMED_GIFT_WINDOW as W,
} from "../../layouts/framed-gift";
import { GOLD, GOLD_DARK, ROUND } from "../palette";
import type { PackagingIllustrationProps } from "../types";

import { boxTones, ribbonTones, wrapTones } from "./tones";

const { x: HX, y: HY } = FRAMED_GIFT_HANGER;
/** Width of the frame's moulding, between the outer edge and the mat. */
const MOULD = 56;

/** Behind the items: cord and nail, the thick frame, the mat and the tissue-lined window. */
export function FramedGiftBack({ wrapper, ribbon }: PackagingIllustrationProps) {
  const t = wrapTones(wrapper);
  const box = boxTones(wrapper);
  const r = ribbonTones(ribbon);
  const stroke = { stroke: box.edge, strokeWidth: 6, ...ROUND } as const;
  const right = F.x + F.width;
  const bottom = F.y + F.height;
  const cord = `M${F.x + 90} ${F.y + 8}L${HX} ${HY}L${right - 90} ${F.y + 8}`;
  return (
    <g data-art="back">
      <ellipse cx="500" cy="925" rx="330" ry="20" fill="#2B1733" opacity="0.16" />
      <path d={cord} fill="none" stroke={r.fill} strokeWidth="9" {...ROUND} />
      <path d={cord} fill="none" stroke={r.light} strokeWidth="3" opacity="0.6" {...ROUND} />
      <circle cx={HX} cy={HY} r="11" fill={GOLD} stroke={GOLD_DARK} strokeWidth="4" />
      <rect
        x={F.x + 10}
        y={F.y + 14}
        width={F.width}
        height={F.height}
        rx="14"
        fill="#2B1733"
        opacity="0.12"
      />
      <rect x={F.x} y={F.y} width={F.width} height={F.height} rx="14" fill={t.base} {...stroke} />
      <path
        d={`M${F.x} ${F.y}L${F.x + MOULD} ${F.y + MOULD}H${right - MOULD}L${right} ${F.y}Z`}
        fill={t.lit}
        opacity="0.85"
      />
      <path
        d={`M${F.x} ${bottom}L${F.x + MOULD} ${bottom - MOULD}H${right - MOULD}L${right} ${bottom}Z`}
        fill={t.back}
        opacity="0.8"
      />
      <path
        d={`M${F.x} ${F.y}L${F.x + MOULD} ${F.y + MOULD}V${bottom - MOULD}L${F.x} ${bottom}Z`}
        fill={t.mid}
        opacity="0.7"
      />
      <rect x={F.x} y={F.y} width={F.width} height={F.height} rx="14" fill="none" {...stroke} />
      <rect
        x={F.x + MOULD}
        y={F.y + MOULD}
        width={F.width - MOULD * 2}
        height={F.height - MOULD * 2}
        fill={box.tissue}
        stroke={box.edge}
        strokeWidth="4"
        {...ROUND}
      />
      <rect x={W.x} y={W.y} width={W.width} height={W.height} fill={box.crease} opacity="0.55" />
      <rect
        x={W.x + 6}
        y={W.y + 6}
        width={W.width - 12}
        height={W.height - 12}
        fill={t.lit}
        opacity="0.5"
      />
      <rect
        x={W.x}
        y={W.y}
        width={W.width}
        height={W.height}
        fill="none"
        stroke={box.edge}
        strokeWidth="4"
        opacity="0.7"
      />
      <path
        d={`M${W.x} ${W.y}H${W.x + W.width}`}
        stroke={box.edge}
        strokeWidth="10"
        opacity="0.18"
      />
    </g>
  );
}
