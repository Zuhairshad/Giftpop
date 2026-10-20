import { shade } from "../../placeholders/color";
import { HEART, itemPalette, luma, PAPER, ROUND } from "../palette";
import { ItemFrame } from "../parts/ItemFrame";
import { ShadedPath } from "../parts/ShadedPath";
import type { ItemIllustrationProps } from "../types";

/** A gift box in three-quarter view, light from the upper left: top brightest, side darkest. */
const FRONT = "M48 96H132V172H48Z";
const SIDE = "M132 96L154 85V161L132 172Z";
const LID_FRONT = "M42 80H138V102H42Z";
const LID_SIDE = "M138 80L160 69V91L138 102Z";
const LID_TOP = "M42 80L64 69H160L138 80Z";
const LOOPS =
  "M101 74C86 50 64 56 76 70C82 77 94 76 101 74ZM103 74C118 50 140 56 128 70C122 77 110 76 103 74Z";
const TAILS = "M99 76L88 100L94 98L97 104L104 77ZM105 77L114 100L108 98L105 104L101 78Z";

/** A lidded gift box tied with a satin ribbon and bow. White satin, or pink on pale boxes. */
export function BoxIllustration({ color }: ItemIllustrationProps) {
  const p = itemPalette(color);
  const ribbon = luma(color) > 0.78 ? HEART : PAPER;
  const ribbonDark = shade(ribbon, -0.32);
  const band = { fill: ribbon, stroke: ribbonDark, strokeWidth: 1.5, ...ROUND };
  const edge = { stroke: p.dark, strokeWidth: 3, ...ROUND };
  return (
    <ItemFrame shape="box" fit={[1.32, -1.3, -19.7]}>
      <ShadedPath d={FRONT} fill={p.fill} deep={p.deep} shadow={p.shadow} stroke={p.dark} />
      <path d={SIDE} fill={p.shadow} {...edge} />
      <path d="M48 166H132L154 155" fill="none" stroke="#000" strokeWidth="4" opacity="0.12" />
      <path d="M80 102H100V172H80Z" {...band} />
      <path d="M140 92L146 89V165L140 168Z" {...band} fill={ribbonDark} />
      <path d={LID_TOP} fill={p.soft} {...edge} />
      <path d={LID_SIDE} fill={p.deep} {...edge} />
      <ShadedPath
        d={LID_FRONT}
        fill={p.fill}
        deep={p.deep}
        lit={p.soft}
        stroke={p.dark}
        shift={3}
      />
      <path d="M42 102H138L160 91" fill="none" stroke="#000" strokeWidth="3" opacity="0.15" />
      <path d="M80 80H100V102H80Z" {...band} />
      <path d="M146 76L152 73V95L146 98Z" {...band} fill={ribbonDark} />
      <path d="M80 80L100 80L122 69L102 69Z" {...band} />
      <path d="M51 75.6L147 75.6L151 73.4L55 73.4Z" {...band} />
      <path d={TAILS} {...band} />
      <path d={LOOPS} {...band} strokeWidth={2} />
      <path
        d="M84 64C90 70 96 72 100 73M120 64C114 70 108 72 104 73"
        fill="none"
        stroke={ribbonDark}
        strokeWidth="2"
        opacity="0.6"
        {...ROUND}
      />
      <ellipse cx="102" cy="74" rx="6" ry="5" fill={ribbon} stroke={ribbonDark} strokeWidth="2" />
      <path d="M53 108V164" stroke={p.shine} strokeWidth="4" opacity="0.4" {...ROUND} />
    </ItemFrame>
  );
}
