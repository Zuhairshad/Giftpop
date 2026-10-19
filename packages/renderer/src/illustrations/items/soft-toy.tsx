import { HEART, INK, itemPalette, ROUND } from "../palette";
import { ItemFrame } from "../parts/ItemFrame";
import { ShadedPath } from "../parts/ShadedPath";
import { circlePath, ellipsePath } from "../parts/shapes";
import type { ItemIllustrationProps } from "../types";

/** A teddy: ears, belly, muzzle, face. Fur is the item colour; eyes, nose and blush are fixed. */
export function SoftToyIllustration({ color }: ItemIllustrationProps) {
  const p = itemPalette(color);
  const part = { fill: p.fill, deep: p.deep, stroke: p.dark };
  return (
    <ItemFrame shape="soft-toy" fit={[1.28, 2.6, -14.1]}>
      <ShadedPath d={circlePath(62, 62, 20)} {...part} shift={4} />
      <circle cx="62" cy="62" r="10" fill={p.soft} />
      <ShadedPath d={circlePath(138, 62, 20)} {...part} shift={4} />
      <circle cx="138" cy="62" r="10" fill={p.soft} />
      <ShadedPath d={ellipsePath(100, 150, 40, 34)} {...part} />
      <ellipse cx="100" cy="156" rx="22" ry="20" fill={p.soft} />
      <ShadedPath d={circlePath(100, 94, 44)} {...part} shift={7} />
      <ellipse cx="100" cy="108" rx="19" ry="14" fill={p.soft} stroke={p.dark} strokeWidth="2.5" />
      <ellipse cx="100" cy="102" rx="6.5" ry="4.5" fill={p.dark} />
      <circle cx="84" cy="86" r="4.5" fill={INK} />
      <circle cx="116" cy="86" r="4.5" fill={INK} />
      <circle cx="85.5" cy="84.5" r="1.5" fill="#fff" />
      <circle cx="117.5" cy="84.5" r="1.5" fill="#fff" />
      <path d="M92 114q8 6 16 0" fill="none" stroke={p.dark} strokeWidth="2.5" {...ROUND} />
      <circle cx="74" cy="104" r="6" fill={HEART} opacity="0.35" />
      <circle cx="126" cy="104" r="6" fill={HEART} opacity="0.35" />
      <path
        d="M72 66q6-12 18-14"
        fill="none"
        stroke="#fff"
        strokeWidth="4"
        opacity="0.35"
        {...ROUND}
      />
    </ItemFrame>
  );
}
