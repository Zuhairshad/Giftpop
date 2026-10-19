import { GOLD, GOLD_DARK, GOLD_LIGHT, itemPalette, PAPER, ROUND } from "../palette";
import { Dots, Stripe } from "../parts/Dots";
import { ItemFrame } from "../parts/ItemFrame";
import { ShadedPath } from "../parts/ShadedPath";
import { roundRectPath } from "../parts/shapes";
import type { ItemIllustrationProps } from "../types";

const BODY = "M60 84h80v78a16 16 0 0 1-16 16H76a16 16 0 0 1-16-16Z";
const STAR = "M100 114l3.5 8 8.5.8-6.5 5.6 2 8.4-7.5-4.5-7.5 4.5 2-8.4-6.5-5.6 8.5-.8Z";

/** A jar of something sweet: gold lid, white label with a star. */
export function JarIllustration({ color }: ItemIllustrationProps) {
  const p = itemPalette(color);
  return (
    <ItemFrame shape="jar" fit={[1.3, 1.3, -24.7]}>
      <ShadedPath d={BODY} fill={p.fill} deep={p.deep} stroke={p.dark} />
      <path d="M62 90h76" stroke={p.dark} strokeWidth="3" opacity="0.3" {...ROUND} />
      <rect
        x="56"
        y="60"
        width="88"
        height="24"
        rx="8"
        fill={GOLD}
        stroke={GOLD_DARK}
        strokeWidth="3"
      />
      <path d="M64 70h72" stroke={GOLD_LIGHT} strokeWidth="3" opacity="0.7" {...ROUND} />
      <path
        d="M66 78h68"
        stroke={GOLD_DARK}
        strokeWidth="2"
        opacity="0.3"
        strokeDasharray="3 5"
        {...ROUND}
      />
      <path
        d={roundRectPath(70, 106, 60, 44, 8)}
        fill={PAPER}
        stroke={p.dark}
        strokeWidth="2.5"
        {...ROUND}
      />
      <path d={STAR} fill={p.dark} opacity="0.7" />
      <Stripe x={66} y={94} height={62} color={p.light} opacity={0.6} />
      <Dots
        at={[
          [128, 98],
          [122, 160],
          [78, 162],
        ]}
        color={p.dark}
      />
    </ItemFrame>
  );
}
