import { SILVER, SILVER_DARK, itemPalette, ROUND } from "../palette";
import { Radial, ref } from "../parts/gradients";
import { useArtId } from "../parts/ids";
import { ItemFrame } from "../parts/ItemFrame";
import type { ItemIllustrationProps } from "../types";

const BODY =
  "M100 28C142 28 158 60 156 90C154 120 126 144 104 149L100 151L96 149C74 144 46 120 44 90C42 60 58 28 100 28Z";
const RIBBON = "M100 160C90 168 110 172 100 180C90 188 110 190 101 198";

/** A latex party balloon: a glossy round body, a tight knot and a curled ribbon. */
export function BalloonIllustration({ color }: ItemIllustrationProps) {
  const p = itemPalette(color);
  const gloss = useArtId("balloon-gloss", color);
  return (
    <ItemFrame shape="balloon" fit={[1.04, 0, -13.5]}>
      <defs>
        <Radial
          id={gloss}
          cx={80}
          cy={60}
          r={100}
          stops={[
            [0, p.shine],
            [0.18, p.soft],
            [0.45, p.fill],
            [0.8, p.deep],
            [1, p.shadow],
          ]}
        />
      </defs>
      <path d={RIBBON} fill="none" stroke={SILVER_DARK} strokeWidth="3" {...ROUND} />
      <path d={RIBBON} fill="none" stroke={SILVER} strokeWidth="1.4" {...ROUND} />
      <path d={BODY} fill={ref(gloss)} stroke={p.dark} strokeWidth="3" {...ROUND} />
      <path
        d="M93 150Q100 147 107 150L104 160Q100 162 96 160Z"
        fill={p.deep}
        stroke={p.dark}
        strokeWidth="2.5"
        {...ROUND}
      />
      <path d="M98 151v8M102 151v8" stroke={p.dark} strokeWidth="1" opacity="0.5" />
      <ellipse
        cx="74"
        cy="62"
        rx="10"
        ry="19"
        fill="#fff"
        opacity="0.6"
        transform="rotate(28 74 62)"
      />
      <circle cx="92" cy="44" r="4" fill="#fff" opacity="0.6" />
      <path
        d="M140 92C138 112 126 128 110 138"
        fill="none"
        stroke={p.light}
        strokeWidth="3"
        opacity="0.35"
        {...ROUND}
      />
    </ItemFrame>
  );
}
