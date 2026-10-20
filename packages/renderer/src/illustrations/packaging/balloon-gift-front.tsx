import { useId } from "react";

import { GOLD, ROUND } from "../palette";
import type { PackagingIllustrationProps } from "../types";

import { Bow } from "./Bow";
import { boxTones, ribbonTones, wrapTones } from "./tones";

/** Over the items: the closed base box with a ribbon band, a lid and a small bow at the knot. */
export function BalloonGiftFront({ wrapper, ribbon }: PackagingIllustrationProps) {
  const t = wrapTones(wrapper);
  const box = boxTones(wrapper);
  const r = ribbonTones(ribbon);
  const id = useId().replace(/:/g, "");
  const stroke = { stroke: box.edge, strokeWidth: 6, ...ROUND } as const;
  return (
    <g data-art="front">
      <clipPath id={`balloon-gift-clip-${id}`}>
        <path d="M340 740H660V900H340Z" />
      </clipPath>
      <path d="M340 740H660V900H340Z" fill={t.base} {...stroke} />
      <g clipPath={`url(#balloon-gift-clip-${id})`}>
        <path d="M340 740H402V900H340Z" fill={t.mid} opacity="0.55" />
        <path d="M464 740H536V900H464Z" fill={r.fill} />
        <path d="M464 740V900M536 740V900" stroke={r.edge} strokeWidth="4" />
        <path d="M340 884H660" stroke={t.fold} strokeWidth="4" opacity="0.4" />
      </g>
      <path d="M322 700H678V752H322Z" fill={t.lit} {...stroke} />
      <path d="M464 700H536V752H464Z" fill={r.fill} stroke={r.edge} strokeWidth="4" />
      <path d="M340 714H420" stroke="#fff" strokeWidth="8" opacity="0.45" {...ROUND} />
      <circle cx="500" cy="690" r="9" fill={GOLD} />
      <g transform="translate(500 694)">
        <Bow ribbon={ribbon} scale={0.42} />
      </g>
    </g>
  );
}
