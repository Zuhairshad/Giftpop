import { shade } from "../../placeholders/color";
import { HEART, itemPalette, ROUND } from "../palette";
import { Stripe } from "../parts/Dots";
import { ItemFrame } from "../parts/ItemFrame";
import { ShadedPath } from "../parts/ShadedPath";
import { HEART_PATH } from "../parts/shapes";
import type { ItemIllustrationProps } from "../types";

const HANDLE = "M134 88h12a20 20 0 0 1 0 44h-14";
const BODY = "M50 72h86v76a22 22 0 0 1-22 22H72a22 22 0 0 1-22-22Z";

/** A mug with a heart, a handle and a little coffee showing at the rim. */
export function MugIllustration({ color }: ItemIllustrationProps) {
  const p = itemPalette(color);
  return (
    <ItemFrame shape="mug" fit={[1.3, -7.8, -22.1]}>
      <path d={HANDLE} fill="none" stroke={p.dark} strokeWidth="12" {...ROUND} />
      <path d={HANDLE} fill="none" stroke={p.fill} strokeWidth="6" {...ROUND} />
      <ShadedPath d={BODY} fill={p.fill} deep={p.deep} stroke={p.dark} />
      <ellipse
        cx="93"
        cy="72"
        rx="43"
        ry="9"
        fill={shade(p.fill, -0.2)}
        stroke={p.dark}
        strokeWidth="3"
      />
      <ellipse cx="93" cy="74" rx="36" ry="5.5" fill="#7a4a35" />
      <ellipse cx="85" cy="73" rx="10" ry="1.8" fill="#a8745a" opacity="0.7" />
      <g transform="translate(93 126) scale(1.1)">
        <path d={HEART_PATH} fill={HEART} />
      </g>
      <Stripe x={58} y={88} height={64} color={p.light} opacity={0.6} />
    </ItemFrame>
  );
}
