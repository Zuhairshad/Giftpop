import { shade } from "../../placeholders/color";
import { itemPalette, ROUND } from "../palette";
import { ItemFrame } from "../parts/ItemFrame";
import { ShadedPath } from "../parts/ShadedPath";
import type { ItemIllustrationProps } from "../types";

const BODY =
  "M100 36C146 36 162 74 150 106C142 128 118 144 100 148C82 144 58 128 50 106C38 74 54 36 100 36Z";

/** A helium balloon: glossy highlight, tied knot, a curling string. */
export function BalloonIllustration({ color }: ItemIllustrationProps) {
  const p = itemPalette(color);
  return (
    <ItemFrame shape="balloon" fit={[1.15, 4.6, -3.5]}>
      <path
        d="M100 150C96 164 106 172 100 192"
        fill="none"
        stroke={shade(color, -0.2)}
        strokeWidth="2.5"
        {...ROUND}
      />
      <ShadedPath d={BODY} fill={p.fill} deep={p.deep} stroke={p.dark} shift={8} />
      <path d="M92 146l8 12 8-12Z" fill={p.dark} stroke={p.dark} strokeWidth="2" {...ROUND} />
      <ellipse
        cx="74"
        cy="66"
        rx="9"
        ry="16"
        fill={p.light}
        opacity="0.75"
        transform="rotate(24 74 66)"
      />
      <circle cx="90" cy="46" r="3.5" fill={p.light} opacity="0.6" />
      <path
        d="M128 60q8 10 6 24"
        fill="none"
        stroke={p.dark}
        strokeWidth="3"
        opacity="0.18"
        {...ROUND}
      />
    </ItemFrame>
  );
}
