import { useId } from "react";

import { BASKET_OPENING } from "../../layouts/basket";
import { ROUND } from "../palette";
import type { PackagingIllustration, PackagingIllustrationProps } from "../types";

import { Bow } from "./Bow";
import { boxTones, wrapTones } from "./tones";
import { ellipseY, frontRim, rimTissue, taperedWall } from "./vessel-shape";

const OPEN = BASKET_OPENING;
const BASE = { cy: 810, rx: 250, ry: 52 };
const BODY = taperedWall(OPEN, BASE);
const HANDLE = `M${OPEN.cx - OPEN.rx + 28} ${OPEN.cy}C${OPEN.cx - 280} 150 ${OPEN.cx + 280} 150 ${OPEN.cx + OPEN.rx - 28} ${OPEN.cy}`;
const BACK_TISSUE = rimTissue(OPEN, "back", 24, 34, 8);
const FRONT_TISSUE = rimTissue(OPEN, "front", 20, 30, 9);
/** Woven rows: heights between the rim and the base. */
const ROWS = [600, 645, 690, 735, 780];
const STAKES = 11;

/** Behind the items: ground shadow, the woven handle arching over, the dark inside and tissue. */
function BasketBack({ wrapper }: PackagingIllustrationProps) {
  const t = wrapTones(wrapper);
  const box = boxTones(wrapper);
  return (
    <g data-art="back">
      <ellipse cx="500" cy="852" rx="380" ry="24" fill="#2B1733" opacity="0.08" />
      <ellipse cx="500" cy="850" rx="300" ry="14" fill="#2B1733" opacity="0.16" />
      <path d={HANDLE} fill="none" stroke={box.edge} strokeWidth="48" {...ROUND} />
      <path d={HANDLE} fill="none" stroke={t.base} strokeWidth="36" {...ROUND} />
      <path
        d={HANDLE}
        fill="none"
        stroke={t.back}
        strokeWidth="36"
        strokeDasharray="14 18"
        opacity="0.7"
      />
      <path d={HANDLE} fill="none" stroke={t.lit} strokeWidth="6" opacity="0.5" {...ROUND} />
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

/** Over the items: tissue along the front rim, the woven body, a braided rim and a bow. */
function BasketFront({ wrapper, ribbon }: PackagingIllustrationProps) {
  const t = wrapTones(wrapper);
  const box = boxTones(wrapper);
  const clipId = `basket-body-${useId().replace(/:/g, "")}`;
  const stroke = { stroke: box.edge, strokeWidth: 6, ...ROUND } as const;
  const rowRx = (y: number) =>
    OPEN.rx + (BASE.rx - OPEN.rx) * ((y - OPEN.cy) / (BASE.cy - OPEN.cy));
  const rows = ROWS.map((y) => {
    const rx = rowRx(y);
    return `M${OPEN.cx - rx} ${y}A${rx} ${OPEN.ry} 0 0 0 ${OPEN.cx + rx} ${y}`;
  }).join("");
  const stakes = Array.from({ length: STAKES }, (_, i) => {
    const u = (i / (STAKES - 1)) * 2 - 1;
    const topX = OPEN.cx + u * OPEN.rx * 0.96;
    const bottomX = OPEN.cx + u * BASE.rx * 0.96;
    const topY = ellipseY(OPEN, topX, OPEN.cy, "front");
    const bottomY = ellipseY({ ...OPEN, rx: BASE.rx, ry: BASE.ry }, bottomX, BASE.cy, "front");
    return `M${topX} ${topY}L${bottomX} ${bottomY}`;
  }).join("");
  const bowX = OPEN.cx - OPEN.rx + 90;
  return (
    <g data-art="front">
      <defs>
        <clipPath id={clipId}>
          <path d={BODY} />
        </clipPath>
      </defs>
      <path d={FRONT_TISSUE.d} fill={box.tissue} stroke={box.edge} strokeWidth="4" {...ROUND} />
      <path d={BODY} fill={t.base} {...stroke} />
      <g clipPath={`url(#${clipId})`}>
        <path d={stakes} fill="none" stroke={t.back} strokeWidth="10" opacity="0.55" />
        <path d={rows} fill="none" stroke={t.lit} strokeWidth="26" opacity="0.5" />
        <path d={rows} fill="none" stroke={box.edge} strokeWidth="3" opacity="0.35" />
      </g>
      <path d={BODY} fill="none" {...stroke} />
      <path d={frontRim(OPEN)} fill="none" stroke={box.edge} strokeWidth="30" {...ROUND} />
      <path d={frontRim(OPEN)} fill="none" stroke={t.mid} strokeWidth="22" {...ROUND} />
      <path
        d={frontRim(OPEN)}
        fill="none"
        stroke={t.lit}
        strokeWidth="22"
        strokeDasharray="16 14"
        opacity="0.8"
      />
      <g transform={`translate(${bowX} ${ellipseY(OPEN, bowX, OPEN.cy, "front") + 6}) rotate(-12)`}>
        <Bow ribbon={ribbon} scale={0.55} />
      </g>
    </g>
  );
}

/** A woven basket with a handle, tissue and a bow on the rim, items heaped in a mound. */
export const BasketIllustration: PackagingIllustration = { Back: BasketBack, Front: BasketFront };
