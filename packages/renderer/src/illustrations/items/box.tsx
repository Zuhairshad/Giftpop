import { shade } from "../../placeholders/color";
import { HEART, itemPalette, ROUND } from "../palette";
import { Dots } from "../parts/Dots";
import { ItemFrame } from "../parts/ItemFrame";
import { ShadedPath } from "../parts/ShadedPath";
import { roundRectPath } from "../parts/shapes";
import type { ItemIllustrationProps } from "../types";

/** A small gift box with a lid and a pink ribbon bow. The ribbon is a fixed accent. */
export function BoxIllustration({ color }: ItemIllustrationProps) {
  const p = itemPalette(color);
  const ribbonDark = shade(HEART, -0.35);
  return (
    <ItemFrame shape="box" fit={[1.3, 1.3, -10.4]}>
      <ShadedPath
        d={roundRectPath(46, 86, 108, 82, 8)}
        fill={p.fill}
        deep={p.deep}
        stroke={p.dark}
      />
      <ShadedPath
        d={roundRectPath(40, 66, 120, 30, 8)}
        fill={p.soft}
        deep={p.light}
        stroke={p.dark}
        shift={3}
      />
      <rect x="90" y="66" width="20" height="102" fill={HEART} />
      <path d="M90 96v72M110 96v72" stroke={ribbonDark} strokeWidth="2" opacity="0.5" />
      <path
        d="M100 66C70 30 52 56 82 66ZM100 66C130 30 148 56 118 66Z"
        fill={HEART}
        stroke={ribbonDark}
        strokeWidth="2.5"
        {...ROUND}
      />
      <circle
        cx="100"
        cy="66"
        r="7"
        fill={shade(HEART, -0.15)}
        stroke={ribbonDark}
        strokeWidth="2"
      />
      <rect x="52" y="98" width="6" height="62" rx="3" fill="#fff" opacity="0.35" />
      <Dots
        at={[
          [128, 112],
          [136, 140],
          [70, 150],
        ]}
        color={p.dark}
      />
    </ItemFrame>
  );
}
