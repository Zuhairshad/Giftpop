import { mix } from "../../placeholders/color";
import { GOLD, GREEN, GREEN_DARK, itemPalette, PAPER, ROUND, WOOD } from "../palette";
import { Linear, ref } from "../parts/gradients";
import { useArtId } from "../parts/ids";
import { ItemFrame } from "../parts/ItemFrame";
import type { ItemIllustrationProps } from "../types";

/** Outer edge 44..156 x 34..166, opening 60..140 x 50..150: four bevelled sides of the moulding. */
const TOP = "M44 34H156L140 50H60Z";
const LEFT = "M44 34L60 50V150L44 166Z";
const BOTTOM = "M44 166L60 150H140L156 166Z";
const RIGHT = "M156 34V166L140 150V50Z";

/** A standing photo frame: bevelled moulding lit from the upper left, a mat and a sunny photo. */
export function FrameIllustration({ color }: ItemIllustrationProps) {
  const p = itemPalette(color);
  const sky = useArtId("frame-sky", "sky");
  const edge = { stroke: p.dark, strokeWidth: 1.5, ...ROUND };
  return (
    <ItemFrame shape="frame" fit={[1.21, 0, -8.4]}>
      <defs>
        <Linear
          id={sky}
          x2={0}
          y2={1}
          stops={[
            [0, "#9ED3EE"],
            [1, "#E3F3FA"],
          ]}
        />
      </defs>
      <path d="M138 160L152 180" stroke={mix(WOOD, "#000", 0.3)} strokeWidth="6" {...ROUND} />
      <path d={TOP} fill={p.soft} {...edge} />
      <path d={LEFT} fill={p.fill} {...edge} />
      <path d={BOTTOM} fill={p.deep} {...edge} />
      <path d={RIGHT} fill={p.shadow} {...edge} />
      <path d="M60 50H140V150H60Z" fill={PAPER} stroke={p.dark} strokeWidth="2" />
      <path d="M70 60H130V140H70Z" fill={ref(sky)} />
      <circle cx="114" cy="80" r="9" fill={GOLD} />
      <path d="M70 116C84 100 98 104 110 114C118 108 126 108 130 110V140H70Z" fill={GREEN} />
      <path d="M70 128C88 118 110 120 130 128V140H70Z" fill={GREEN_DARK} opacity="0.7" />
      <path d="M78 74q5-4 10 0q5-4 10 0" fill="none" stroke="#fff" strokeWidth="2" {...ROUND} />
      <path d="M70 60H130V140H70Z" fill="none" stroke={mix(PAPER, "#000", 0.2)} strokeWidth="1.5" />
      <path d="M74 104L104 64H118L82 116Z" fill="#fff" opacity="0.25" />
      <path d="M44 34H156V166H44Z" fill="none" stroke={p.dark} strokeWidth="3" {...ROUND} />
      <path d="M50 42H148" stroke={p.shine} strokeWidth="2" opacity="0.6" {...ROUND} />
      <path d="M44 166H156" stroke="#000" strokeWidth="3" opacity="0.15" {...ROUND} />
      <rect x="94" y="152" width="12" height="4" rx="1" fill={GOLD} />
    </ItemFrame>
  );
}
