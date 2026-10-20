import { mix } from "../../placeholders/color";
import { GOLD, HEART, itemPalette, PAPER, ROUND, WOOD } from "../palette";
import { ItemFrame } from "../parts/ItemFrame";
import { ShadedPath } from "../parts/ShadedPath";
import { HEART_PATH, roundRectPath } from "../parts/shapes";
import type { ItemIllustrationProps } from "../types";

const ENVELOPE = roundRectPath(34, 78, 112, 80, 4);
const COVER = roundRectPath(70, 32, 80, 128, 4);
const SCRIPT = "M86 116c3-9 7-9 8 0s5 8 8 0 5-8 8 0 5 8 8 0 4-6 6-2";
const SPARKLE = "M0-6C1-2 2-1 6 0C2 1 1 2 0 6C-1 2-2 1-6 0C-2-1-1-2 0-6Z";

/** A greeting card propped against its kraft envelope: folded cover, inset panel, a heart, lettering. */
export function CardIllustration({ color }: ItemIllustrationProps) {
  const p = itemPalette(color);
  const kraft = mix(PAPER, WOOD, 0.3);
  const kraftDark = mix(WOOD, "#000", 0.35);
  return (
    <ItemFrame shape="card" fit={[1.18, 7.1, 2.1]}>
      <g transform="rotate(-10 90 118)">
        <path d={ENVELOPE} fill={kraft} stroke={kraftDark} strokeWidth="2.5" {...ROUND} />
        <path
          d="M36 82L90 122L144 82"
          fill="none"
          stroke={kraftDark}
          strokeWidth="2"
          opacity="0.6"
          {...ROUND}
        />
        <path
          d="M36 154L80 118M144 154L100 118"
          stroke={kraftDark}
          strokeWidth="1.5"
          opacity="0.35"
          {...ROUND}
        />
      </g>
      <g transform="rotate(6 110 96)">
        <path d={roundRectPath(74, 36, 80, 128, 4)} fill="#000" opacity="0.14" />
        <ShadedPath
          d={COVER}
          fill={p.fill}
          deep={p.deep}
          shadow={p.shadow}
          stroke={p.dark}
          shift={4}
        />
        <path d="M76 34V158" stroke={p.dark} strokeWidth="2" opacity="0.35" />
        <path
          d={roundRectPath(82, 44, 58, 104, 3)}
          fill={PAPER}
          stroke={p.dark}
          strokeWidth="1.5"
          {...ROUND}
        />
        <path d={roundRectPath(86, 48, 50, 96, 2)} fill="none" stroke={GOLD} strokeWidth="1.2" />
        <g transform="translate(111 82) scale(1.05)">
          <path d={HEART_PATH} fill={HEART} stroke={mix(HEART, "#000", 0.3)} strokeWidth="1.5" />
          <path
            d="M-9 -7q4-5 9-3"
            fill="none"
            stroke="#fff"
            strokeWidth="2.5"
            opacity="0.6"
            {...ROUND}
          />
        </g>
        <path d={SCRIPT} fill="none" stroke={p.dark} strokeWidth="2.2" {...ROUND} />
        <path d="M94 132h34" stroke={p.dark} strokeWidth="2" opacity="0.4" {...ROUND} />
        <g fill={GOLD}>
          <path d={SPARKLE} transform="translate(96 62)" />
          <path d={SPARKLE} transform="translate(128 98) scale(0.7)" />
        </g>
      </g>
    </ItemFrame>
  );
}
