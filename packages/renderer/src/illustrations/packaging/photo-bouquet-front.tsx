import { useId } from "react";

import { PHOTO_BOUQUET_GATHER } from "../../layouts/photo-bouquet";
import { shade } from "../../placeholders/color";
import { GOLD, GOLD_DARK, ROUND } from "../palette";
import type { PackagingIllustrationProps } from "../types";

import { Bow } from "./Bow";
import { ruffleEdge } from "./ruffle";
import { ribbonTones, wrapTones } from "./tones";

const { x: GX, y: GY } = PHOTO_BOUQUET_GATHER;

/** The cone's scalloped mouth, left to right, bulging up along a shallow curve. */
const MOUTH = ruffleEdge(300, 700, (u) => 664 - 26 * Math.sin(Math.PI * u), 7, 10);
const [MX, MY] = MOUTH.points[0] ?? [300, 664];
const CONE = `M${MX} ${MY}${MOUTH.d}L500 950Z`;

/** Zero-length strokes with round caps: paper dots, drawn without a pattern id. */
const DOTS = "M420 700h0M560 700h0M490 760h0M600 790h0M440 830h0M520 880h0";

const TWINE_BACK = `M${GX - 92} ${GY + 22}Q${GX} ${GY + 48} ${GX + 92} ${GY + 22}`;
const TWINE = `M${GX - 92} ${GY + 20}Q${GX} ${GY + 46} ${GX + 92} ${GY + 20}`;

/** Over the items: a slim paper cone with a sheen and dots, the twine tie and a bow at the gather. */
export function PhotoBouquetFront({ wrapper, ribbon }: PackagingIllustrationProps) {
  const t = wrapTones(wrapper);
  const r = ribbonTones(ribbon);
  const id = useId().replace(/:/g, "");
  const stroke = { stroke: t.edge, strokeWidth: 5, ...ROUND } as const;
  return (
    <g data-art="front">
      <defs>
        <clipPath id={`photo-bouquet-clip-${id}`}>
          <path d={CONE} />
        </clipPath>
      </defs>
      <path d={CONE} fill={t.base} {...stroke} />
      <g clipPath={`url(#photo-bouquet-clip-${id})`}>
        <path d="M500 950L300 640H420Z" fill={t.lit} opacity="0.8" />
        <path d="M500 950L700 640H600Z" fill={t.mid} opacity="0.6" />
        <path d={DOTS} stroke="#fff" strokeWidth="10" opacity="0.3" {...ROUND} />
        <path d="M500 950L360 660M500 950L640 660" stroke={t.fold} strokeWidth="3" opacity="0.3" />
      </g>
      <path
        d="M360 690L455 840"
        stroke="#fff"
        strokeWidth="12"
        opacity="0.28"
        fill="none"
        {...ROUND}
      />
      <path d={TWINE_BACK} fill="none" stroke={GOLD_DARK} strokeWidth="9" {...ROUND} />
      <path d={TWINE} fill="none" stroke={shade(GOLD, 0.1)} strokeWidth="4" {...ROUND} />
      <circle cx={GX} cy={GY + 8} r="8" fill={r.fill} />
      <g transform={`translate(${GX} ${GY + 28})`}>
        <Bow ribbon={ribbon} scale={0.8} />
      </g>
    </g>
  );
}
