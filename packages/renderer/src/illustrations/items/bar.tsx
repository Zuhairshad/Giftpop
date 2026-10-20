import {
  CHOCOLATE,
  CHOCOLATE_DARK,
  CHOCOLATE_LIGHT,
  GOLD,
  GOLD_DARK,
  GOLD_LIGHT,
  itemPalette,
  PAPER,
  ROUND,
} from "../palette";
import { Linear, metalStops, ref } from "../parts/gradients";
import { useArtId } from "../parts/ids";
import { ItemFrame } from "../parts/ItemFrame";
import { ShadedPath } from "../parts/ShadedPath";
import { HEART_PATH } from "../parts/shapes";
import type { ItemIllustrationProps } from "../types";

/** The wrapper below the torn top edge, down to the crimped seal. */
const WRAPPER = "M66 62l6 5 6-4 7 5 6-4 6 4 7-4 6 4 6-4 7 4 5-3V162H66Z";
const FOIL = "M68 44l6-3 6 3 7-3 6 3 7-3 6 3 7-3 6 3 7-3 6 3 4-2V70H68Z";
const SEAL =
  "M64 160h76v14l-4.75 6-4.75-6-4.75 6-4.75-6-4.75 6-4.75-6-4.75 6-4.75-6-4.75 6-4.75-6-4.75 6-4.75-6-4.75 6-4.75-6-4.75 6-4.75-6Z";

/**
 * A chocolate bar, opened: crinkled gold foil and two squares of chocolate above a torn
 * wrapper, a cream logo plate, a gold stripe and a crimped seal at the bottom.
 */
export function BarIllustration({ color }: ItemIllustrationProps) {
  const p = itemPalette(color);
  const foil = useArtId("bar-foil", "gold");
  return (
    <ItemFrame shape="bar" fit={[1.08, -6.2, -3.8]}>
      <defs>
        <Linear id={foil} stops={metalStops(GOLD_LIGHT, GOLD, GOLD_DARK)} />
      </defs>
      <g transform="rotate(-10 100 100)">
        <path
          d="M75 26h54v26H75Z"
          fill={CHOCOLATE}
          stroke={CHOCOLATE_DARK}
          strokeWidth="2.5"
          {...ROUND}
        />
        <path d="M102 26v26M75 39h54" stroke={CHOCOLATE_DARK} strokeWidth="2" opacity="0.7" />
        <path
          d="M79 30h19M106 30h19"
          stroke={CHOCOLATE_LIGHT}
          strokeWidth="2"
          opacity="0.8"
          {...ROUND}
        />
        <path d={FOIL} fill={ref(foil)} stroke={GOLD_DARK} strokeWidth="2.5" {...ROUND} />
        <path
          d="M76 48l4 16M92 46l-3 20M114 48l5 16M128 46l-2 20"
          stroke={GOLD_DARK}
          strokeWidth="1.2"
          opacity="0.5"
        />
        <ShadedPath
          d={WRAPPER}
          fill={p.fill}
          deep={p.deep}
          shadow={p.shadow}
          stroke={p.dark}
          shift={7}
        />
        <path d="M66 136h72" stroke={GOLD} strokeWidth="6" />
        <path d="M66 133h72M66 139h72" stroke={GOLD_DARK} strokeWidth="1.2" opacity="0.6" />
        <ellipse cx="102" cy="104" rx="26" ry="17" fill={PAPER} stroke={p.dark} strokeWidth="2" />
        <ellipse cx="102" cy="104" rx="21" ry="12.5" fill="none" stroke={GOLD} strokeWidth="1.5" />
        <g transform="translate(102 103) scale(0.62)">
          <path d={HEART_PATH} fill={p.fill} stroke={p.dark} strokeWidth="2.5" {...ROUND} />
        </g>
        <path d="M76 80l52 0" stroke={p.light} strokeWidth="2" opacity="0.5" {...ROUND} />
        <path d="M74 74V154" stroke={p.shine} strokeWidth="5" opacity="0.55" {...ROUND} />
        <path d={SEAL} fill={p.deep} stroke={p.dark} strokeWidth="2.5" {...ROUND} />
        <path
          d="M70 162v12M78 162v12M86 162v12M94 162v12M102 162v12M110 162v12M118 162v12M126 162v12M134 162v12"
          stroke={p.dark}
          strokeWidth="1.2"
          opacity="0.45"
        />
        <path d="M64 160h76" stroke={p.dark} strokeWidth="2.5" {...ROUND} />
      </g>
    </ItemFrame>
  );
}
