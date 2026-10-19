import { itemPalette, PAPER, ROUND } from "../palette";
import { Dots, Stripe } from "../parts/Dots";
import { ItemFrame } from "../parts/ItemFrame";
import { ShadedPath } from "../parts/ShadedPath";
import { roundRectPath } from "../parts/shapes";
import type { ItemIllustrationProps } from "../types";

const BODY =
  "M92 68C60 78 62 100 62 120V166a14 14 0 0 0 14 14h48a14 14 0 0 0 14-14V120C138 100 140 78 108 68Z";

/** A glass bottle with a cork-style cap and a paper label. */
export function BottleIllustration({ color }: ItemIllustrationProps) {
  const p = itemPalette(color);
  return (
    <ItemFrame shape="bottle" fit={[1.19, 3.6, -2.4]}>
      <rect x="88" y="24" width="24" height="26" rx="6" fill={p.dark} />
      <path d="M93 31h14" stroke={p.light} strokeWidth="2.5" opacity="0.45" {...ROUND} />
      <rect x="92" y="46" width="16" height="26" fill={p.fill} stroke={p.dark} strokeWidth="3" />
      <ShadedPath d={BODY} fill={p.fill} deep={p.deep} stroke={p.dark} />
      <path d="M92 60h16" stroke={p.dark} strokeWidth="3" opacity="0.4" {...ROUND} />
      <path
        d={roundRectPath(74, 108, 52, 46, 8)}
        fill={PAPER}
        stroke={p.dark}
        strokeWidth="2.5"
        {...ROUND}
      />
      <path d="M88 126q12-14 24 0q-12 22-24 0Z" fill={p.fill} opacity="0.8" />
      <path d="M82 144h36" stroke={p.dark} strokeWidth="2.5" opacity="0.4" {...ROUND} />
      <Stripe x={70} y={88} height={80} color={p.light} opacity={0.6} />
      <Dots
        at={[
          [128, 128],
          [120, 168],
          [76, 172],
        ]}
        color={p.dark}
      />
    </ItemFrame>
  );
}
