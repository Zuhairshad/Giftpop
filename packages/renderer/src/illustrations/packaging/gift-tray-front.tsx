import { useId } from "react";

import { GIFT_TRAY } from "../../layouts/gift-tray";
import { GOLD, ROUND } from "../palette";
import type { PackagingIllustrationProps } from "../types";

import { Bow } from "./Bow";
import { ruffleEdge } from "./ruffle";
import { boxTones, ribbonTones, wrapTones } from "./tones";

const { left, right, frontY, bottomY } = GIFT_TRAY;
const TAPER = 24;
const CORNER = 16;
const BAND_Y = frontY + 58;
const BAND_HEIGHT = 34;
const BOW_X = 300;

const WALL = `M${left} ${frontY}H${right}L${right - TAPER} ${bottomY - CORNER}Q${right - TAPER - 2} ${bottomY} ${right - TAPER - CORNER} ${bottomY}H${left + TAPER + CORNER}Q${left + TAPER + 2} ${bottomY} ${left + TAPER} ${bottomY - CORNER}Z`;
/** The cloth lining hangs over the near rim in soft scallops (drawn right to left, bulging down). */
const CLOTH = ruffleEdge(right - 30, left + 30, () => frontY + 6, 14, -14);
const CLOTH_PATH = `M${left + 30} ${frontY - 16}H${right - 30}V${frontY + 6}${CLOTH.d}Z`;
const RIM_LINE = `M${left} ${frontY}H${right}`;

/** Over the items: the tray's front wall, a ribbon band, the cloth lining over the rim and a bow. */
export function GiftTrayFront({ wrapper, ribbon }: PackagingIllustrationProps) {
  const t = wrapTones(wrapper);
  const box = boxTones(wrapper);
  const r = ribbonTones(ribbon);
  const clipId = `tray-wall-clip-${useId().replace(/:/g, "")}`;
  const bandX = left + TAPER / 2;
  const bandW = right - left - TAPER;
  return (
    <g data-art="front">
      <defs>
        <clipPath id={clipId}>
          <path d={WALL} />
        </clipPath>
      </defs>
      <path d={WALL} fill={t.base} />
      <g clipPath={`url(#${clipId})`}>
        <rect
          x={right - 150}
          y={frontY + 6}
          width="104"
          height={bottomY - frontY - 10}
          fill={t.back}
          opacity="0.3"
        />
        <rect x={bandX} y={BAND_Y - 4} width={bandW} height={BAND_HEIGHT + 8} fill={r.edge} />
        <rect x={bandX} y={BAND_Y} width={bandW} height={BAND_HEIGHT} fill={r.fill} />
        <path
          d={`M${left + 20} ${BAND_Y + 6}H${right - 20}`}
          stroke={GOLD}
          strokeWidth="2.5"
          opacity="0.9"
        />
        <path
          d={`M${left + 20} ${frontY + 22}H${right - 20}`}
          stroke="#fff"
          strokeWidth="9"
          opacity="0.3"
          {...ROUND}
        />
      </g>
      <path d={WALL} fill="none" stroke={box.edge} strokeWidth="6" {...ROUND} />
      <path d={CLOTH_PATH} fill={box.tissue} stroke={box.crease} strokeWidth="4" {...ROUND} />
      <path d={RIM_LINE} stroke={t.lit} strokeWidth="12" {...ROUND} />
      <path d={RIM_LINE} stroke={box.edge} strokeWidth="4" {...ROUND} />
      <g transform={`translate(${BOW_X} ${BAND_Y + BAND_HEIGHT / 2 + 8}) rotate(-6)`}>
        <Bow ribbon={ribbon} scale={0.55} />
      </g>
    </g>
  );
}
