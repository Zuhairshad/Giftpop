import { mix } from "../../placeholders/color";
import { GLASS, GOLD, GOLD_DARK, GOLD_LIGHT, itemPalette, ROUND } from "../palette";
import { cylinderStops, Linear, metalStops, ref } from "../parts/gradients";
import { useArtId } from "../parts/ids";
import { ItemFrame } from "../parts/ItemFrame";
import type { ItemIllustrationProps } from "../types";

const FLACON = "M58 94L72 80H128L142 94V160L128 174H72L58 160Z";
const WELL = "M70 104L80 94H120L130 104V150L120 160H80L70 150Z";
const BEVELS = "M58 94L70 104M142 94L130 104M142 160L130 150M58 160L70 150";
const CAP_LEFT = "M82 66V36L90 28H100V66Z";
const CAP_RIGHT = "M100 66V28H110L118 36V66Z";

/** A perfume flacon: thick faceted glass, tinted scent, a gold collar and a faceted cap. */
export function PerfumeIllustration({ color }: ItemIllustrationProps) {
  const p = itemPalette(color);
  const scent = useArtId("perfume-scent", color);
  const collar = useArtId("perfume-collar", "gold");
  const glass = mix(GLASS, color, 0.12);
  return (
    <ItemFrame shape="perfume" fit={[1.21, 0, -1.2]}>
      <defs>
        <Linear id={scent} stops={cylinderStops(p)} />
        <Linear id={collar} stops={metalStops(GOLD_LIGHT, GOLD, GOLD_DARK)} />
      </defs>
      <path d={FLACON} fill={glass} stroke={p.dark} strokeWidth="3" {...ROUND} />
      <path d={WELL} fill={ref(scent)} opacity="0.92" />
      <path d="M71 110H129" stroke={p.shine} strokeWidth="2" opacity="0.7" />
      <path d="M100 80V156" stroke="#fff" strokeWidth="1.5" opacity="0.45" />
      <path d={WELL} fill="none" stroke={p.dark} strokeWidth="1.5" opacity="0.5" {...ROUND} />
      <path d={BEVELS} stroke={p.dark} strokeWidth="1.5" opacity="0.4" />
      <path d="M64 98V156" stroke="#fff" strokeWidth="4" opacity="0.65" {...ROUND} />
      <path d="M76 86H122" stroke="#fff" strokeWidth="2.5" opacity="0.7" {...ROUND} />
      <path d="M136 112V146" stroke="#fff" strokeWidth="2" opacity="0.35" {...ROUND} />
      <path d="M74 166H126" stroke="#000" strokeWidth="2" opacity="0.1" {...ROUND} />
      <rect
        x="86"
        y="124"
        width="28"
        height="14"
        rx="2"
        fill={GOLD_LIGHT}
        stroke={GOLD_DARK}
        strokeWidth="1.5"
      />
      <path d="M92 131h16" stroke={GOLD_DARK} strokeWidth="1.5" opacity="0.7" {...ROUND} />
      <rect
        x="88"
        y="64"
        width="24"
        height="17"
        rx="2"
        fill={ref(collar)}
        stroke={GOLD_DARK}
        strokeWidth="2"
      />
      <path d="M88 70h24M88 75h24" stroke={GOLD_DARK} strokeWidth="1" opacity="0.5" />
      <path d={CAP_LEFT} fill={p.soft} stroke={p.dark} strokeWidth="2.5" {...ROUND} />
      <path d={CAP_RIGHT} fill={p.deep} stroke={p.dark} strokeWidth="2.5" {...ROUND} />
      <path d="M90 28H110L118 36H82Z" fill={p.shine} stroke={p.dark} strokeWidth="2" {...ROUND} />
      <path d="M88 40V60" stroke="#fff" strokeWidth="2.5" opacity="0.7" {...ROUND} />
    </ItemFrame>
  );
}
