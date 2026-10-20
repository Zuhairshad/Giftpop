import { BALLOON_GIFT_KNOT } from "../../layouts/balloon-gift";
import { ROUND } from "../palette";
import type { PackagingIllustrationProps } from "../types";

import { ribbonTones, wrapTones } from "./tones";

const { x: KX, y: KY } = BALLOON_GIFT_KNOT;

/** Strings leave the knot above the box and end under the balloon cluster (scene units). */
const STRINGS = [
  "Q430 600 350 470",
  "Q470 590 420 450",
  "Q500 580 500 440",
  "Q530 590 580 450",
  "Q570 600 650 470",
]
  .map((curve) => `M${KX} ${KY}${curve}`)
  .join("");

/** Behind the items: ground shadow and the curling strings that gather at the knot above the box. */
export function BalloonGiftBack({ wrapper, ribbon }: PackagingIllustrationProps) {
  const t = wrapTones(wrapper);
  const r = ribbonTones(ribbon);
  return (
    <g data-art="back">
      <ellipse cx="500" cy="925" rx="300" ry="22" fill="#2B1733" opacity="0.16" />
      <ellipse cx="500" cy="920" rx="230" ry="11" fill="#2B1733" opacity="0.14" />
      <path d={STRINGS} fill="none" stroke={r.light} strokeWidth="5" opacity="0.9" {...ROUND} />
      <path
        d="M500 690Q462 636 430 560M500 690Q540 636 572 560"
        fill="none"
        stroke={t.edge}
        strokeWidth="3"
        opacity="0.35"
        {...ROUND}
      />
    </g>
  );
}
