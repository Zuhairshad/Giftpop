import { mix } from "../../placeholders/color";
import { GLASS, itemPalette, PAPER, ROUND, SILVER, SILVER_DARK } from "../palette";
import { GlassBase, GlassGlints } from "../parts/Glass";
import { cylinderStops, Linear, metalStops, ref } from "../parts/gradients";
import { useArtId } from "../parts/ids";
import { ItemFrame } from "../parts/ItemFrame";
import type { ItemIllustrationProps } from "../types";

const GLASS_BODY =
  "M90 44H110V70C110 82 136 88 136 108V166a12 12 0 0 1-12 12H76a12 12 0 0 1-12-12V108C64 88 90 82 90 70Z";
const LABEL = "M64 116Q100 124 136 116V150Q100 158 64 150Z";
const FLUTES = "M90 30v10M95 30v10M100 30v10M105 30v10M110 30v10";

/** A glass drinks bottle: crown cap, a tinted drink showing through, a wrap-around paper label. */
export function BottleIllustration({ color }: ItemIllustrationProps) {
  const p = itemPalette(color);
  const clip = useArtId("bottle-clip", GLASS_BODY);
  const drink = useArtId("bottle-drink", color);
  const cap = useArtId("bottle-cap", "silver");
  return (
    <ItemFrame shape="bottle" fit={[1.17, 0, -3.5]}>
      <defs>
        <clipPath id={clip}>
          <path d={GLASS_BODY} />
        </clipPath>
        <Linear id={drink} stops={cylinderStops(p)} />
        <Linear id={cap} stops={metalStops("#F4F6F9", SILVER, SILVER_DARK)} />
      </defs>
      <path d={GLASS_BODY} fill={GLASS} />
      <g clipPath={ref(clip)}>
        <rect x="64" y="80" width="72" height="98" fill={ref(drink)} opacity="0.92" />
        <ellipse cx="100" cy="80" rx="11" ry="2.5" fill={mix(color, "#ffffff", 0.45)} />
        <path d={GLASS_BODY} fill="none" stroke={GLASS} strokeWidth="6" opacity="0.5" />
      </g>
      <path d={LABEL} fill={PAPER} />
      <path
        d="M64 116Q100 124 136 116M136 150Q100 158 64 150"
        fill="none"
        stroke={p.dark}
        strokeWidth="2"
        opacity="0.5"
      />
      <path d="M118 118Q128 118 136 116V150Q128 152 118 152Z" fill="#000" opacity="0.08" />
      <ellipse cx="100" cy="132" rx="11" ry="8" fill={p.fill} stroke={p.dark} strokeWidth="1.5" />
      <path d="M84 146h32" stroke={p.dark} strokeWidth="2.5" opacity="0.45" {...ROUND} />
      <GlassGlints left={64} right={136} top={92} bottom={172} />
      <path d="M94 50V70" stroke="#fff" strokeWidth="3" opacity="0.6" {...ROUND} />
      <GlassBase x={64} y={170} width={72} />
      <path d={GLASS_BODY} fill="none" stroke={p.dark} strokeWidth="3" {...ROUND} />
      <rect
        x="86"
        y="28"
        width="28"
        height="14"
        rx="3"
        fill={ref(cap)}
        stroke={SILVER_DARK}
        strokeWidth="2.5"
      />
      <path d={FLUTES} stroke={SILVER_DARK} strokeWidth="1.5" opacity="0.6" />
      <path d="M88 44h24" stroke={p.dark} strokeWidth="3" {...ROUND} />
    </ItemFrame>
  );
}
