import { useId } from "react";

import { MUG_OPENING } from "../../layouts/mug-bouquet";
import { ROUND } from "../palette";
import type { PackagingIllustration, PackagingIllustrationProps } from "../types";

import { Bow } from "./Bow";
import { boxTones, ribbonTones, wrapTones } from "./tones";
import { ellipseY, frontRim, rimTissue, taperedWall } from "./vessel-shape";

const OPEN = MUG_OPENING;
const BASE = { cy: 800, rx: 152, ry: 36 };
const BODY = taperedWall(OPEN, BASE);
const BAND_TOP = 640;
const BAND_BOTTOM = 680;
const BACK_TISSUE = rimTissue(OPEN, "back", 14, 30, 5);
const FRONT_TISSUE = rimTissue(OPEN, "front", 12, 26, 5);

/** Left and right edge of the tapered body at height `y`. */
function sideX(y: number): [number, number] {
  const t = (y - OPEN.cy) / (BASE.cy - OPEN.cy);
  const rx = OPEN.rx + (BASE.rx - OPEN.rx) * t;
  return [OPEN.cx - rx, OPEN.cx + rx];
}

/** Behind the items: the ground shadow, the mug's dark inside and tissue rising from the back. */
function MugBack({ wrapper }: PackagingIllustrationProps) {
  const box = boxTones(wrapper);
  return (
    <g data-art="back">
      <ellipse cx="500" cy="842" rx="300" ry="22" fill="#2B1733" opacity="0.08" />
      <ellipse cx="480" cy="840" rx="210" ry="13" fill="#2B1733" opacity="0.16" />
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
    </g>
  );
}

/** Over the items: tissue along the front rim, the glazed mug body, its handle, a ribbon and a bow. */
function MugFront({ wrapper, ribbon }: PackagingIllustrationProps) {
  const t = wrapTones(wrapper);
  const box = boxTones(wrapper);
  const r = ribbonTones(ribbon);
  const patternId = `mug-dots-${useId().replace(/:/g, "")}`;
  const stroke = { stroke: box.edge, strokeWidth: 6, ...ROUND } as const;
  const [, right] = sideX(530);
  const [, rightLow] = sideX(730);
  const handle = `M${right - 6} 530C${right + 150} 520 ${rightLow + 150} 740 ${rightLow - 6} 730`;
  const [bl, br] = sideX(BAND_TOP);
  const [bl2, br2] = sideX(BAND_BOTTOM);
  const bandRy = OPEN.ry * 0.9;
  const band =
    `M${bl} ${BAND_TOP}A${(br - bl) / 2} ${bandRy} 0 0 0 ${br} ${BAND_TOP}` +
    `L${br2} ${BAND_BOTTOM}A${(br2 - bl2) / 2} ${bandRy} 0 0 1 ${bl2} ${BAND_BOTTOM}Z`;
  const bowX = OPEN.cx - 70;
  const bowY =
    (ellipseY(OPEN, bowX, BAND_TOP, "front") + ellipseY(OPEN, bowX, BAND_BOTTOM, "front")) / 2;
  return (
    <g data-art="front">
      <defs>
        <pattern id={patternId} width="52" height="52" patternUnits="userSpaceOnUse">
          <circle cx="10" cy="12" r="4" fill="#fff" />
          <circle cx="36" cy="38" r="4" fill="#fff" />
        </pattern>
      </defs>
      <path d={handle} fill="none" stroke={box.edge} strokeWidth="52" {...ROUND} />
      <path d={handle} fill="none" stroke={t.base} strokeWidth="38" {...ROUND} />
      <path d={handle} fill="none" stroke={t.lit} strokeWidth="8" opacity="0.6" {...ROUND} />
      <path d={FRONT_TISSUE.d} fill={box.tissue} stroke={box.edge} strokeWidth="4" {...ROUND} />
      <path d={BODY} fill={t.base} {...stroke} />
      <path d={BODY} fill={`url(#${patternId})`} opacity="0.22" />
      <path
        d={`M${sideX(560)[0] + 34} 560L${sideX(760)[0] + 40} 760`}
        stroke="#fff"
        strokeWidth="14"
        opacity="0.45"
        {...ROUND}
      />
      <path d={band} fill={r.fill} stroke={r.edge} strokeWidth="5" {...ROUND} />
      <path d={BODY} fill="none" {...stroke} />
      <path d={frontRim(OPEN)} fill="none" stroke={t.lit} strokeWidth="14" {...ROUND} />
      <path d={frontRim(OPEN)} fill="none" stroke={box.edge} strokeWidth="5" {...ROUND} />
      <g transform={`translate(${bowX} ${bowY}) rotate(-8)`}>
        <Bow ribbon={ribbon} scale={0.5} />
      </g>
    </g>
  );
}

/** A glazed mug with items standing out of it like a bunch of flowers, a ribbon and a bow. */
export const MugBouquetIllustration: PackagingIllustration = { Back: MugBack, Front: MugFront };
