import { useId } from "react";

import { GOLD, ROUND } from "../palette";
import type { PackagingIllustrationProps } from "../types";

import { Bow } from "./Bow";
import { frontEdgePath, frontEdgeY, frontWallPath, WALL_DEPTH } from "./heart-box-shape";
import { boxTones, ribbonTones, wrapTones } from "./tones";

const WALL = frontWallPath();
const RIM = frontEdgePath();
const BAND_OFFSET = 62;
const BAND_WIDTH = 44;
const BOW_X = 372;
const RAIL_GAP = 14;
const HIGHLIGHT_DY = 24;
const WALL_SHADE_HEIGHT = WALL_DEPTH + 260;

/** Over the items: the heart's front wall, a ribbon band along it, the lit rim and a bow. */
export function HeartBoxFront({ wrapper, ribbon }: PackagingIllustrationProps) {
  const t = wrapTones(wrapper);
  const box = boxTones(wrapper);
  const r = ribbonTones(ribbon);
  const id = useId().replace(/:/g, "");
  const clipId = `heart-wall-clip-${id}`;
  const stroke = { stroke: box.edge, strokeWidth: 6, ...ROUND } as const;
  const band = frontEdgePath({ dy: BAND_OFFSET });
  const bowY = frontEdgeY(BOW_X) + BAND_OFFSET;
  return (
    <g data-art="front">
      <defs>
        <clipPath id={clipId}>
          <path d={WALL} />
        </clipPath>
      </defs>
      <path d={WALL} fill={t.base} />
      <g clipPath={`url(#${clipId})`}>
        <rect x="610" y="440" width="220" height={WALL_SHADE_HEIGHT} fill={t.back} opacity="0.5" />
        <rect x="170" y="440" width="90" height={WALL_SHADE_HEIGHT} fill={t.back} opacity="0.25" />
        <path d={band} fill="none" stroke={r.edge} strokeWidth={BAND_WIDTH + 8} />
        <path d={band} fill="none" stroke={r.fill} strokeWidth={BAND_WIDTH} />
        <path
          d={frontEdgePath({ dy: BAND_OFFSET - RAIL_GAP })}
          fill="none"
          stroke={GOLD}
          strokeWidth="2.5"
          opacity="0.9"
        />
        <path
          d={frontEdgePath({ dy: BAND_OFFSET + RAIL_GAP })}
          fill="none"
          stroke={GOLD}
          strokeWidth="2.5"
          opacity="0.9"
        />
        <path
          d={frontEdgePath({ dy: BAND_OFFSET - 6 })}
          fill="none"
          stroke={r.light}
          strokeWidth="5"
          opacity="0.4"
          {...ROUND}
        />
        <path
          d={frontEdgePath({ dy: HIGHLIGHT_DY })}
          fill="none"
          stroke="#fff"
          strokeWidth="9"
          opacity="0.3"
          {...ROUND}
        />
      </g>
      <path d={WALL} fill="none" {...stroke} />
      <path d={RIM} fill="none" stroke={t.lit} strokeWidth="14" {...ROUND} />
      <path d={RIM} fill="none" stroke={box.edge} strokeWidth="5" {...ROUND} />
      <g transform={`translate(${BOW_X} ${bowY}) rotate(-8)`}>
        <Bow ribbon={ribbon} scale={0.62} />
      </g>
    </g>
  );
}
