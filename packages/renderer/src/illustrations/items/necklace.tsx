import { itemPalette, ROUND } from "../palette";
import { ItemFrame } from "../parts/ItemFrame";
import { ShadedPath } from "../parts/ShadedPath";
import { roundRectPath } from "../parts/shapes";
import type { ItemIllustrationProps } from "../types";

/** The chain: from the clasp ring, down the left side to the bail, and the mirror on the right. */
const CHAIN =
  "M100 38C36 34 28 94 78 122C86 127 90 131 95 135M100 38C164 34 172 94 122 122C114 127 110 131 105 135";
const BAR = roundRectPath(70, 141, 60, 17, 5);

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
        strokeDasharray="0.1 4.6"
        {...ROUND}
      />
      <path
        d={CHAIN}
        fill="none"
        stroke={p.light}
        strokeWidth="2.8"
        strokeDasharray="0.1 4.6"
        {...ROUND}
      />
      <circle cx="100" cy="32" r="7" fill="none" stroke={p.dark} strokeWidth="5" />
      <circle cx="100" cy="32" r="7" fill="none" stroke={p.soft} strokeWidth="2.4" />
      <circle cx="100" cy="138" r="5" fill="none" stroke={p.dark} strokeWidth="4.5" />
      <circle cx="100" cy="138" r="5" fill="none" stroke={p.soft} strokeWidth="2" />
      <ShadedPath d={BAR} fill={p.fill} deep={p.deep} shadow={p.shadow} stroke={p.dark} shift={3} />
      <path d="M78 151H122" stroke={p.dark} strokeWidth="2" opacity="0.7" {...ROUND} />
      <path d="M88 154H112" stroke={p.dark} strokeWidth="1.2" opacity="0.5" {...ROUND} />
      <path d="M76 146H92" stroke={p.shine} strokeWidth="2.4" opacity="0.85" {...ROUND} />
    </ItemFrame>
  );
}
