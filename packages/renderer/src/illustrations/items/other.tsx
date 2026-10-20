import type { ItemShape } from "@giftpop/contracts";

import { GOLD, GOLD_DARK, itemPalette, ROUND } from "../palette";
import { Dots } from "../parts/Dots";
import { ItemFrame } from "../parts/ItemFrame";
import { ShadedPath } from "../parts/ShadedPath";
import type { ItemIllustrationProps } from "../types";

const STAR = "M100 30l16 38 40 4-30 28 9 40-35-21-35 21 9-40-30-28 40-4Z";
const SPARKLE = "M0-9C1-3 3-1 9 0C3 1 1 3 0 9C-1 3-3 1-9 0C-3-1-1-3 0-9Z";

/**
 * Anything else: a plump star with a gold sparkle, so an unknown item still reads as a treat.
 * `starFor(shape)` gives the same star tagged with another shape, for shapes still waiting on art.
 */
export function starFor(shape: ItemShape) {
  return function StarIllustration({ color }: ItemIllustrationProps) {
    return <Star shape={shape} color={color} />;
  };
}

export function OtherIllustration({ color }: ItemIllustrationProps) {
  return <Star shape="other" color={color} />;
}

function Star({ shape, color }: { shape: ItemShape; color: string }) {
  const p = itemPalette(color);
  return (
    <ItemFrame shape={shape} fit={[1.3, 3.9, 22.1]}>
      <ShadedPath d={STAR} fill={p.fill} deep={p.deep} stroke={p.dark} strokeWidth={4} shift={6} />
      <path d="M80 66l12-4" stroke={p.light} strokeWidth="5" opacity="0.8" {...ROUND} />
      <Dots
        at={[
          [110, 98],
          [92, 112],
          [120, 120],
        ]}
        color={p.dark}
        r={2.4}
      />
      <g transform="translate(142 44) scale(1.3)">
        <path d={SPARKLE} fill={GOLD} stroke={GOLD_DARK} strokeWidth="1.5" {...ROUND} />
      </g>
    </ItemFrame>
  );
}
