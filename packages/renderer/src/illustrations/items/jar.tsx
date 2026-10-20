import { mix } from "../../placeholders/color";
import { GLASS, GOLD, GOLD_DARK, GOLD_LIGHT, itemPalette, PAPER, ROUND, WOOD } from "../palette";
import { GlassBase, GlassGlints } from "../parts/Glass";
import { cylinderStops, Linear, metalStops, ref } from "../parts/gradients";
import { useArtId } from "../parts/ids";
import { ItemFrame } from "../parts/ItemFrame";
import type { ItemIllustrationProps } from "../types";

const GLASS_BODY =
  "M66 76H134V82C142 88 144 96 144 108V160a20 20 0 0 1-20 20H76a20 20 0 0 1-20-20V108C56 96 58 88 66 82Z";
const RIDGES = "M70 54v20M78 54v20M86 54v20M94 54v20M102 54v20M110 54v20M118 54v20M126 54v20";
const SWEETS: ReadonlyArray<readonly [number, number]> = [
  [72, 104],
  [92, 98],
  [114, 102],
  [132, 108],
  [82, 122],
];

/** A glass jar of sweets: ridged gold lid, twine bow, the filling showing through, a kraft label. */
export function JarIllustration({ color }: ItemIllustrationProps) {
  const p = itemPalette(color);
  const clip = useArtId("jar-clip", GLASS_BODY);
  const fill = useArtId("jar-fill", color);
  const lid = useArtId("jar-lid", "gold");
  return (
    <ItemFrame shape="jar" fit={[1.38, 0, -22]}>
      <defs>
        <clipPath id={clip}>
          <path d={GLASS_BODY} />
        </clipPath>
        <Linear id={fill} stops={cylinderStops(p)} />
        <Linear id={lid} stops={metalStops(GOLD_LIGHT, GOLD, GOLD_DARK)} />
      </defs>
      <path d={GLASS_BODY} fill={GLASS} />
      <g clipPath={ref(clip)}>
        <rect x="56" y="104" width="88" height="76" fill={ref(fill)} />
        {SWEETS.map(([x, y]) => (
          <g key={`${x}-${y}`}>
            <circle cx={x} cy={y} r="10" fill={p.fill} stroke={p.dark} strokeWidth="2" />
            <circle cx={x - 3} cy={y - 3} r="3" fill={p.shine} opacity="0.8" />
          </g>
        ))}
        <path d={GLASS_BODY} fill="none" stroke={GLASS} strokeWidth="6" opacity="0.45" />
      </g>
      <path
        d="M70 128h60v34H70Z"
        fill={mix(PAPER, WOOD, 0.3)}
        stroke={p.dark}
        strokeWidth="2"
        {...ROUND}
      />
      <path d="M78 140h44M84 150h32" stroke={p.dark} strokeWidth="2.5" opacity="0.45" {...ROUND} />
      <path d="M70 134h60" stroke={p.fill} strokeWidth="3" opacity="0.8" />
      <GlassGlints left={56} right={144} top={92} bottom={170} />
      <GlassBase x={58} y={172} width={84} />
      <path d={GLASS_BODY} fill="none" stroke={p.dark} strokeWidth="3" {...ROUND} />
      <path
        d="M64 80c-6 4-6 10 0 12M136 80c6 4 6 10 0 12"
        stroke={WOOD}
        strokeWidth="2.5"
        fill="none"
        {...ROUND}
      />
      <rect
        x="62"
        y="52"
        width="76"
        height="26"
        rx="5"
        fill={ref(lid)}
        stroke={GOLD_DARK}
        strokeWidth="2.5"
      />
      <path d={RIDGES} stroke={GOLD_DARK} strokeWidth="1.3" opacity="0.45" />
      <path d="M66 56h68" stroke="#fff" strokeWidth="2" opacity="0.6" {...ROUND} />
      <path
        d="M100 80c-12-10-22-2-12 4ZM100 80c12-10 22-2 12 4Z"
        fill="none"
        stroke={WOOD}
        strokeWidth="2.5"
        {...ROUND}
      />
      <path d="M100 80l-6 12M100 80l6 12" stroke={WOOD} strokeWidth="2.5" {...ROUND} />
    </ItemFrame>
  );
}
