import { HEART, INK, itemPalette, ROUND } from "../palette";
import { ItemFrame } from "../parts/ItemFrame";
import { ShadedPath } from "../parts/ShadedPath";
import { circlePath, ellipsePath } from "../parts/shapes";
import { Bowtie, FurTufts, PawPad } from "../parts/Teddy";
import type { ItemIllustrationProps } from "../types";

const LEFT_ARM = "M70 112C52 116 46 138 54 150C62 156 72 146 76 132Z";
const RIGHT_ARM = "M130 112C148 116 154 138 146 150C138 156 128 146 124 132Z";

/** A plush teddy, sitting: stitched seams, paw pads, a satin bow; fur is the item colour. */
export function SoftToyIllustration({ color }: ItemIllustrationProps) {
  const p = itemPalette(color);
  const fur = { fill: p.fill, deep: p.deep, shadow: p.shadow, stroke: p.dark };
  const seam = {
    fill: "none",
    stroke: p.dark,
    strokeWidth: 1.6,
    strokeDasharray: "3 3",
    opacity: 0.55,
  };
  return (
    <ItemFrame shape="soft-toy" fit={[1.16, 0, -6.9]}>
      <ShadedPath d={circlePath(64, 48, 18)} {...fur} shift={4} />
      <circle cx="65" cy="50" r="9" fill={p.soft} />
      <ShadedPath d={circlePath(136, 48, 18)} {...fur} shift={4} />
      <circle cx="135" cy="50" r="9" fill={p.soft} />
      <ShadedPath d={ellipsePath(100, 140, 40, 36)} {...fur} shift={7} />
      <ellipse cx="100" cy="146" rx="22" ry="21" fill={p.soft} opacity="0.85" />
      <path d="M100 126V168" {...seam} />
      <ShadedPath d={LEFT_ARM} {...fur} shift={4} />
      <ShadedPath d={RIGHT_ARM} {...fur} shift={4} />
      <ShadedPath d={ellipsePath(70, 166, 20, 16)} {...fur} shift={4} />
      <ShadedPath d={ellipsePath(130, 166, 20, 16)} {...fur} shift={4} />
      <PawPad x={70} y={168} p={p} />
      <PawPad x={130} y={168} p={p} />
      <ShadedPath d={ellipsePath(100, 80, 42, 38)} {...fur} shift={7} />
      <path d="M100 43V62" {...seam} />
      <FurTufts p={p} />
      <ellipse cx="100" cy="97" rx="18" ry="13" fill={p.soft} stroke={p.dark} strokeWidth="2" />
      <path d="M93 89Q100 85 107 89Q104 96 100 97Q96 96 93 89Z" fill={INK} />
      <path
        d="M96 89q3-1.5 5 0"
        fill="none"
        stroke="#fff"
        strokeWidth="1.5"
        opacity="0.7"
        {...ROUND}
      />
      <path d="M100 97v5M92 104q8 5 16 0" fill="none" stroke={INK} strokeWidth="2" {...ROUND} />
      <circle cx="84" cy="76" r="5" fill={INK} />
      <circle cx="116" cy="76" r="5" fill={INK} />
      <circle cx="85.8" cy="74.2" r="1.7" fill="#fff" />
      <circle cx="117.8" cy="74.2" r="1.7" fill="#fff" />
      <circle cx="74" cy="94" r="5" fill={HEART} opacity="0.25" />
      <circle cx="126" cy="94" r="5" fill={HEART} opacity="0.25" />
      <Bowtie x={100} y={118} />
      <path
        d="M70 58q8-12 22-14"
        fill="none"
        stroke={p.shine}
        strokeWidth="3.5"
        opacity="0.5"
        {...ROUND}
      />
    </ItemFrame>
  );
}
