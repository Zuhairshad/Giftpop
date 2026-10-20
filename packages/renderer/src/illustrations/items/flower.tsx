import { GREEN, GREEN_DARK, itemPalette, ROUND } from "../palette";
import { ItemFrame } from "../parts/ItemFrame";
import { Leaf } from "../parts/Leaf";
import { RoseHead } from "../parts/Rose";
import type { ItemIllustrationProps } from "../types";

const STEM = "M100 104C96 136 104 160 99 194";
const SEPALS = "M100 104L80 112L94 104ZM100 104L120 113L106 104Z";

/** A garden rose: rings of cupped petals around a spiral heart, a thorned stem and two leaves. */
export function FlowerIllustration({ color }: ItemIllustrationProps) {
  const p = itemPalette(color);
  return (
    <ItemFrame shape="flower" fit={[1.05, 0, -10.9]}>
      <path d={STEM} fill="none" stroke={GREEN_DARK} strokeWidth="8" {...ROUND} />
      <path d={STEM} fill="none" stroke={GREEN} strokeWidth="4.5" {...ROUND} />
      <path d="M99 138l-7-3 6 7ZM101 172l7-2-6 7Z" fill={GREEN_DARK} />
      <Leaf
        d="M99 150C84 134 60 134 50 146C62 160 86 162 99 150Z"
        vein="M96 150C82 144 66 144 54 146"
      />
      <Leaf
        d="M101 168C116 150 140 150 150 160C138 174 114 176 101 168Z"
        vein="M104 167C118 160 132 158 146 160"
      />
      <path d={SEPALS} fill={GREEN} stroke={GREEN_DARK} strokeWidth="2" {...ROUND} />
      <RoseHead p={p} cx={100} cy={68} />
    </ItemFrame>
  );
}
