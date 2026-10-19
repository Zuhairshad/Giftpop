import { HEART, itemPalette, PAPER, ROUND } from "../palette";
import { Dots } from "../parts/Dots";
import { ItemFrame } from "../parts/ItemFrame";
import { ShadedPath } from "../parts/ShadedPath";
import { HEART_PATH, roundRectPath } from "../parts/shapes";
import type { ItemIllustrationProps } from "../types";

/** A greeting card, slightly turned: tinted cover, paper window with a heart, written lines. */
export function CardIllustration({ color }: ItemIllustrationProps) {
  const p = itemPalette(color);
  return (
    <ItemFrame shape="card" fit={[1.22, 2.4, 6.1]}>
      <g transform="rotate(7 100 100)">
        <ShadedPath
          d={roundRectPath(52, 30, 96, 136, 9)}
          fill={p.soft}
          deep={p.fill}
          stroke={p.dark}
        />
        <path
          d={roundRectPath(62, 40, 76, 116, 5)}
          fill={PAPER}
          stroke={p.light}
          strokeWidth="2"
          {...ROUND}
        />
        <g transform="translate(100 82) scale(1.25)">
          <path d={HEART_PATH} fill={HEART} />
          <path
            d="M-9 -7q4-5 9-3"
            fill="none"
            stroke="#fff"
            strokeWidth="2.5"
            opacity="0.6"
            {...ROUND}
          />
        </g>
        <path
          d="M74 118h52M80 128h40M86 138h28"
          stroke={p.dark}
          strokeWidth="3"
          opacity="0.5"
          {...ROUND}
        />
        <Dots
          at={[
            [134, 44],
            [66, 150],
            [140, 152],
          ]}
          color={p.dark}
        />
        <rect x="56" y="36" width="5" height="64" rx="2.5" fill="#fff" opacity="0.4" />
      </g>
    </ItemFrame>
  );
}
