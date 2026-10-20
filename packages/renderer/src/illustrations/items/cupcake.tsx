import { mix } from "../../placeholders/color";
import { CAKE, GREEN, itemPalette, PAPER, ROUND } from "../palette";
import { ItemFrame } from "../parts/ItemFrame";
import { ShadedPath } from "../parts/ShadedPath";
import { Sprinkles } from "../parts/Sprinkles";
import type { ItemIllustrationProps } from "../types";

const LINER = "M56 124H144L132 178H68Z";
const PLEATS =
  "M66 126L74 176M78 126L84 177M90 126L94 177M102 126L104 177M114 126L113 177M126 126L122 177M138 126L130 176";
const CAKE_TOP = "M54 126C54 110 146 110 146 126Z";
const TIER_1 =
  "M52 122C42 106 60 92 76 98C84 86 116 86 124 98C140 92 158 106 148 122C132 132 68 132 52 122Z";
const TIER_2 =
  "M68 100C62 86 76 76 90 80C96 68 114 70 118 80C132 78 140 90 132 100C118 108 82 108 68 100Z";
const TIER_3 = "M82 80C80 66 92 58 100 60C108 52 122 60 116 74C114 82 90 84 82 80Z";

/** A cupcake: a pleated paper liner, golden sponge, a three-tier frosting swirl, sprinkles, a cherry. */
export function CupcakeIllustration({ color }: ItemIllustrationProps) {
  const p = itemPalette(color);
  const liner = mix(PAPER, color, 0.3);
  const linerDark = mix(liner, "#000", 0.3);
  const icing = { fill: p.fill, deep: p.deep, shadow: p.shadow, stroke: p.dark, lit: p.shine };
  return (
    <ItemFrame shape="cupcake" fit={[1.22, 0, -7.3]}>
      <path d={LINER} fill={liner} stroke={linerDark} strokeWidth="2.5" {...ROUND} />
      <path d={PLEATS} stroke={linerDark} strokeWidth="1.6" opacity="0.6" />
      <path d="M120 126L144 124L132 178H116Z" fill="#000" opacity="0.1" />
      <path d={CAKE_TOP} fill={CAKE} stroke={mix(CAKE, "#000", 0.35)} strokeWidth="2" {...ROUND} />
      <ShadedPath d={TIER_1} {...icing} shift={6} />
      <ShadedPath d={TIER_2} {...icing} shift={5} />
      <ShadedPath d={TIER_3} {...icing} shift={4} />
      <path
        d="M58 112q8-10 18-12M76 90q8-8 16-8M90 70q4-6 10-8"
        fill="none"
        stroke="#fff"
        strokeWidth="2.5"
        opacity="0.55"
        {...ROUND}
      />
      <Sprinkles />
      <path d="M104 52Q106 40 116 34" fill="none" stroke={GREEN} strokeWidth="2.5" {...ROUND} />
      <circle cx="102" cy="58" r="10" fill="#C8243C" stroke="#7A1222" strokeWidth="2" />
      <circle cx="98.5" cy="54.5" r="3" fill="#fff" opacity="0.6" />
    </ItemFrame>
  );
}
