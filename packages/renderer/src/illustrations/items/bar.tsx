import { GOLD, GOLD_DARK, itemPalette, ROUND } from "../palette";
import { Dots, Stripe } from "../parts/Dots";
import { ItemFrame } from "../parts/ItemFrame";
import { ShadedPath } from "../parts/ShadedPath";
import { HEART_PATH, roundRectPath } from "../parts/shapes";
import type { ItemIllustrationProps } from "../types";

const CRIMP_TOP = "M66 34l8-9 8 9 8-9 8 9 8-9 8 9 8-9 8 9v7h-72z";
const CRIMP_BOTTOM = "M66 170l8 9 8-9 8 9 8-9 8 9 8-9 8 9 8-9v-7h-72z";

/** A wrapped chocolate bar: crimped ends, a gold paper band with a heart, a highlight stripe. */
export function BarIllustration({ color }: ItemIllustrationProps) {
  const p = itemPalette(color);
  return (
    <ItemFrame shape="bar" fit={[1.13, 2.3, -2.3]}>
      <g transform="rotate(-8 100 100)">
        <path d={CRIMP_TOP} fill={p.dark} stroke={p.dark} strokeWidth="2" {...ROUND} />
        <path d={CRIMP_BOTTOM} fill={p.dark} stroke={p.dark} strokeWidth="2" {...ROUND} />
        <ShadedPath
          d={roundRectPath(66, 34, 72, 136, 9)}
          fill={p.fill}
          deep={p.deep}
          stroke={p.dark}
        />
        <rect x="66" y="82" width="72" height="40" fill={GOLD} />
        <rect x="66" y="82" width="72" height="40" fill="none" stroke={GOLD_DARK} strokeWidth="3" />
        <path d="M66 92h72M66 112h72" stroke={GOLD_DARK} strokeWidth="1.5" opacity="0.35" />
        <g transform="translate(102 102) scale(0.95)">
          <path d={HEART_PATH} fill={p.light} stroke={GOLD_DARK} strokeWidth="2.5" {...ROUND} />
        </g>
        <Stripe x={74} y={40} height={124} color={p.light} />
        <Dots
          at={[
            [118, 52],
            [126, 64],
            [112, 142],
            [124, 152],
          ]}
          color={p.dark}
        />
      </g>
    </ItemFrame>
  );
}
