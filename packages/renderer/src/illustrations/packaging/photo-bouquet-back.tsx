import { PHOTO_BOUQUET_GATHER } from "../../layouts/photo-bouquet";
import { GREEN, GREEN_DARK, ROUND } from "../palette";
import type { PackagingIllustrationProps } from "../types";

import { wrapTones } from "./tones";

const { x: GX, y: GY } = PHOTO_BOUQUET_GATHER;

/** Stem ends fan out under the dome (scene units); the items hide the tips. */
const STEMS = [
  "Q500 520 500 330",
  "Q430 540 360 400",
  "Q570 540 640 400",
  "Q380 560 250 500",
  "Q620 560 750 500",
  "Q460 560 420 470",
  "Q540 560 580 470",
  "Q330 600 190 420",
  "Q670 600 810 420",
]
  .map((curve) => `M${GX} ${GY}${curve}`)
  .join("");

/** Behind the items: ground shadow, the green stems gathering at the wrap and the cone's far side. */
export function PhotoBouquetBack({ wrapper }: PackagingIllustrationProps) {
  const t = wrapTones(wrapper);
  return (
    <g data-art="back">
      <ellipse cx="500" cy="950" rx="200" ry="18" fill="#2B1733" opacity="0.16" />
      <path d={STEMS} fill="none" stroke={GREEN_DARK} strokeWidth="9" {...ROUND} />
      <path d={STEMS} fill="none" stroke={GREEN} strokeWidth="5" {...ROUND} />
      <path
        d="M318 660L500 946L682 660Z"
        fill={t.back}
        stroke={t.edge}
        strokeWidth="5"
        {...ROUND}
      />
    </g>
  );
}
