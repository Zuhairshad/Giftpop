import { GOLD, GOLD_DARK, GOLD_LIGHT, INK, itemPalette, ROUND } from "../palette";
import { cylinderStops, Linear, metalStops, Radial, ref } from "../parts/gradients";
import { useArtId } from "../parts/ids";
import { ItemFrame } from "../parts/ItemFrame";
import type { ItemIllustrationProps } from "../types";

const BULLET = "M116 94V62C116 54 124 48 140 42V94Z";
const SLEEVE = "M112 92H144V114H112Z";
const CASE = "M108 112H148V172a4 4 0 0 1-4 4H112a4 4 0 0 1-4-4Z";

/** Make-up: a lipstick in a gold sleeve standing beside a pressed-powder compact. */
export function CosmeticIllustration({ color }: ItemIllustrationProps) {
  const p = itemPalette(color);
  const lacquer = useArtId("cosmetic-lacquer", color);
  const metal = useArtId("cosmetic-metal", "gold");
  const lid = useArtId("cosmetic-lid", color);
  return (
    <ItemFrame shape="cosmetic" fit={[1.31, 9.2, -11.8]}>
      <defs>
        <Linear id={lacquer} stops={cylinderStops(p)} />
        <Linear id={metal} stops={metalStops(GOLD_LIGHT, GOLD, GOLD_DARK)} />
        <Radial
          id={lid}
          cx={64}
          cy={100}
          r={56}
          stops={[
            [0, p.shine],
            [0.35, p.fill],
            [1, p.deep],
          ]}
        />
      </defs>
      <ellipse cx="80" cy="134" rx="42" ry="34" fill={GOLD_DARK} />
      <ellipse cx="80" cy="126" rx="42" ry="34" fill={ref(lid)} stroke={GOLD} strokeWidth="5" />
      <ellipse cx="80" cy="126" rx="42" ry="34" fill="none" stroke={GOLD_DARK} strokeWidth="1.5" />
      <path d="M38 126v8M122 126v8" stroke={GOLD_DARK} strokeWidth="1.5" />
      <ellipse
        cx="80"
        cy="126"
        rx="18"
        ry="14"
        fill="none"
        stroke={GOLD_LIGHT}
        strokeWidth="2"
        opacity="0.8"
      />
      <path d="M74 126q6-8 12 0q-6 8-12 0Z" fill={GOLD} opacity="0.85" />
      <path
        d="M52 112q10-12 26-14"
        fill="none"
        stroke="#fff"
        strokeWidth="3.5"
        opacity="0.55"
        {...ROUND}
      />
      <path d={BULLET} fill={ref(lacquer)} stroke={p.dark} strokeWidth="2.5" {...ROUND} />
      <path
        d="M121 88V64q4-8 12-12"
        fill="none"
        stroke={p.shine}
        strokeWidth="3"
        opacity="0.7"
        {...ROUND}
      />
      <path d={SLEEVE} fill={ref(metal)} stroke={GOLD_DARK} strokeWidth="2" {...ROUND} />
      <path d={CASE} fill={INK} stroke="#000" strokeWidth="2.5" {...ROUND} />
      <path
        d="M108 112H148V120H108Z"
        fill={ref(metal)}
        stroke={GOLD_DARK}
        strokeWidth="2"
        {...ROUND}
      />
      <path d="M115 126V168" stroke="#fff" strokeWidth="4" opacity="0.3" {...ROUND} />
      <path d="M141 128V164" stroke="#fff" strokeWidth="1.5" opacity="0.15" {...ROUND} />
    </ItemFrame>
  );
}
