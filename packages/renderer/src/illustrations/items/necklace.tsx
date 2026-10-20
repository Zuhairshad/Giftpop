import { itemPalette, ROUND } from "../palette";
import { ItemFrame } from "../parts/ItemFrame";
import { ShadedPath } from "../parts/ShadedPath";
import { roundRectPath } from "../parts/shapes";
import type { ItemIllustrationProps } from "../types";

/** The chain: from the clasp ring, down the left side to the bail, and the mirror on the right. */
const CHAIN =
  "M100 38C36 34 28 94 78 122C86 127 90 131 95 135M100 38C164 34 172 94 122 122C114 127 110 131 105 135";
const BAR = roundRectPath(70, 141, 60, 17, 5);
const LINK_DASH = "0.1 4.6";
const CLASP_RING = { cy: 32, r: 7, outer: 5, inner: 2.4 };
const BAIL_RING = { cy: 138, r: 5, outer: 4.5, inner: 2 };

interface RingSpec {
  cy: number;
  r: number;
  outer: number;
  inner: number;
}

/** A metal ring: a dark outline stroke with a lighter stroke on top. */
function Ring({ cy, r, outer, inner, dark, soft }: RingSpec & { dark: string; soft: string }) {
  return (
    <>
      <circle cx="100" cy={cy} r={r} fill="none" stroke={dark} strokeWidth={outer} />
      <circle cx="100" cy={cy} r={r} fill="none" stroke={soft} strokeWidth={inner} />
    </>
  );
}

/** A fine chain draping in a U from a clasp ring, with a flat engraved bar pendant hung on a bail. */
export function NecklaceIllustration({ color }: ItemIllustrationProps) {
  const p = itemPalette(color);
  return (
    <ItemFrame shape="necklace" fit={[1.22, 0, 11]}>
      <path d={CHAIN} fill="none" stroke={p.dark} strokeWidth="1.5" {...ROUND} />
      <path
        d={CHAIN}
        fill="none"
        stroke={p.dark}
        strokeWidth="4.8"
        strokeDasharray={LINK_DASH}
        {...ROUND}
      />
      <path
        d={CHAIN}
        fill="none"
        stroke={p.light}
        strokeWidth="2.8"
        strokeDasharray={LINK_DASH}
        {...ROUND}
      />
      <Ring {...CLASP_RING} dark={p.dark} soft={p.soft} />
      <Ring {...BAIL_RING} dark={p.dark} soft={p.soft} />
      <ShadedPath d={BAR} fill={p.fill} deep={p.deep} shadow={p.shadow} stroke={p.dark} shift={3} />
      <path d="M78 151H122" stroke={p.dark} strokeWidth="2" opacity="0.7" {...ROUND} />
      <path d="M88 154H112" stroke={p.dark} strokeWidth="1.2" opacity="0.5" {...ROUND} />
      <path d="M76 146H92" stroke={p.shine} strokeWidth="2.4" opacity="0.85" {...ROUND} />
    </ItemFrame>
  );
}
