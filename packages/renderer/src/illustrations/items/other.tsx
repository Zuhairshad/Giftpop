import { GOLD, GOLD_DARK, itemPalette, ROUND } from "../palette";
import { ItemFrame } from "../parts/ItemFrame";
import type { ItemIllustrationProps } from "../types";

const CENTRE = [100, 106] as const;
const OUTER = 70;
const INNER = 32;
const SPARKLE = "M0-9C1-3 3-1 9 0C3 1 1 3 0 9C-1 3-3 1-9 0C-3-1-1-3 0-9Z";

function point(index: number, radius: number): string {
  const angle = ((-90 + index * 36) * Math.PI) / 180;
  const x = CENTRE[0] + radius * Math.cos(angle);
  const y = CENTRE[1] + radius * Math.sin(angle);
  return `${x.toFixed(1)} ${y.toFixed(1)}`;
}

/** Ten facets, each from the centre to one tip and its neighbouring valley. Even ones face the light. */
const FACETS = Array.from({ length: 10 }, (_, i) => {
  const tip = i % 2 === 0 ? i : i + 1;
  const valley = i % 2 === 0 ? i + 1 : i;
  return `M${CENTRE[0]} ${CENTRE[1]}L${point(tip % 10, OUTER)}L${point(valley % 10, INNER)}Z`;
});
const OUTLINE = `M${Array.from({ length: 10 }, (_, i) => point(i, i % 2 === 0 ? OUTER : INNER)).join("L")}Z`;

/**
 * Anything else: a bevelled star with a gold sparkle, so an unknown item still reads as a treat.
 * Facets turned toward the upper-left light are lit, the rest fall into shade.
 */
export function OtherIllustration({ color }: ItemIllustrationProps) {
  const p = itemPalette(color);
  return (
    <ItemFrame shape="other" fit={[1.17, 0, 1.8]}>
      {FACETS.map((d, i) => {
        // Facets 7..1 (wrapping) face up and left; the right-hand and lower ones sit in shade.
        const lit = [7, 8, 9, 0, 5, 6].includes(i);
        return <path key={d} d={d} fill={lit ? p.soft : p.deep} stroke={p.fill} strokeWidth="1" />;
      })}
      <path d={OUTLINE} fill="none" stroke={p.dark} strokeWidth="3.5" {...ROUND} />
      <circle cx="84" cy="80" r="4" fill={p.shine} opacity="0.8" />
      <g transform="translate(150 46) scale(1.3)">
        <path d={SPARKLE} fill={GOLD} stroke={GOLD_DARK} strokeWidth="1.5" {...ROUND} />
      </g>
    </ItemFrame>
  );
}
