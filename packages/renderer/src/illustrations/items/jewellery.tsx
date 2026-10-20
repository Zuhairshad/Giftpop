import { mix } from "../../placeholders/color";
import { GOLD, GOLD_DARK, GOLD_LIGHT, itemPalette, PAPER, ROUND } from "../palette";
import { Linear, ref } from "../parts/gradients";
import { useArtId } from "../parts/ids";
import { ItemFrame } from "../parts/ItemFrame";
import { ShadedPath } from "../parts/ShadedPath";
import { roundRectPath } from "../parts/shapes";
import type { ItemIllustrationProps } from "../types";

const LID = "M50 104V62a22 22 0 0 1 22-22H128a22 22 0 0 1 22 22V104Z";
const BASE = roundRectPath(48, 108, 104, 62, 10);
const GEM = "M90 74L95 66H105L110 74L100 88Z";

/** An open ring box: velvet outside, satin-lined lid, a cushion slot holding a gold solitaire ring. */
export function JewelleryIllustration({ color }: ItemIllustrationProps) {
  const p = itemPalette(color);
  const satin = useArtId("jewel-satin", color);
  const lining = mix(PAPER, color, 0.12);
  return (
    <ItemFrame shape="jewellery" fit={[1.35, 0, -6.8]}>
      <defs>
        <Linear
          id={satin}
          x2={1}
          y2={1}
          stops={[
            [0, lining],
            [0.35, "#ffffff"],
            [0.6, lining],
            [1, mix(lining, "#000", 0.12)],
          ]}
        />
      </defs>
      <ShadedPath d={LID} fill={p.fill} deep={p.deep} shadow={p.shadow} stroke={p.dark} shift={4} />
      <path
        d="M60 102V66a14 14 0 0 1 14-14H126a14 14 0 0 1 14 14V102Z"
        fill={ref(satin)}
        stroke={p.dark}
        strokeWidth="1.5"
        {...ROUND}
      />
      <path d="M86 66h28" stroke={GOLD} strokeWidth="2" opacity="0.8" {...ROUND} />
      <path d="M92 72h16" stroke={GOLD} strokeWidth="1.5" opacity="0.6" {...ROUND} />
      <ShadedPath d={BASE} fill={p.fill} deep={p.deep} shadow={p.shadow} stroke={p.dark} />
      <path d="M56 112H144V128H56Z" fill={p.shadow} stroke={p.dark} strokeWidth="2" {...ROUND} />
      <path d="M56 120H144" stroke={p.dark} strokeWidth="2" opacity="0.7" />
      <path d="M48 108H152" stroke={p.dark} strokeWidth="3" {...ROUND} />
      <ellipse cx="100" cy="104" rx="15" ry="18" fill="none" stroke={GOLD_DARK} strokeWidth="8" />
      <ellipse cx="100" cy="104" rx="15" ry="18" fill="none" stroke={GOLD} strokeWidth="5" />
      <path d="M88 96Q90 90 95 87" fill="none" stroke={GOLD_LIGHT} strokeWidth="2" {...ROUND} />
      <path d="M56 116H144V128H56Z" fill={p.shadow} />
      <path d="M56 120H144" stroke={p.dark} strokeWidth="2" opacity="0.7" />
      <path d="M94 88h12l-2 4h-8Z" fill={GOLD} stroke={GOLD_DARK} strokeWidth="1.5" {...ROUND} />
      <path d={GEM} fill="#E4F1F8" stroke="#7E9BAA" strokeWidth="1.8" {...ROUND} />
      <path
        d="M90 74H110M95 66L100 74L105 66M100 74V88"
        fill="none"
        stroke="#7E9BAA"
        strokeWidth="1"
        opacity="0.8"
      />
      <path d="M93 72l3-4" stroke="#fff" strokeWidth="2" {...ROUND} />
      <path d="M58 136V160" stroke={p.shine} strokeWidth="3" opacity="0.35" {...ROUND} />
      <path d="M96 160h8" stroke={GOLD} strokeWidth="3" {...ROUND} />
    </ItemFrame>
  );
}
