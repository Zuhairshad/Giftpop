import { mix } from "../../placeholders/color";
import { FLAME, FLAME_CORE, GLASS, GREEN, itemPalette, PAPER, ROUND, WICK } from "../palette";
import { GlassBase, GlassGlints } from "../parts/Glass";
import { cylinderStops, Linear, ref } from "../parts/gradients";
import { useArtId } from "../parts/ids";
import { ItemFrame } from "../parts/ItemFrame";
import type { ItemIllustrationProps } from "../types";

const TUMBLER = "M58 76H142L138 166a10 10 0 0 1-10 10H72a10 10 0 0 1-10-10Z";
const WAX = "M60 92H140L138 166a10 10 0 0 1-10 10H72a10 10 0 0 1-10-10Z";
const FLAME_PATH = "M100 40C110 54 112 64 106 72C103 76 97 76 94 72C88 64 92 54 100 40Z";

/** A jar candle: tinted wax in a glass tumbler, a lit wick, a melt pool and a paper label. */
export function CandleIllustration({ color }: ItemIllustrationProps) {
  const p = itemPalette(color);
  const wax = useArtId("candle-wax", color);
  return (
    <ItemFrame shape="candle" fit={[1.24, 0, -6.2]}>
      <defs>
        <Linear id={wax} stops={cylinderStops(p)} />
      </defs>
      <circle cx="100" cy="60" r="26" fill={FLAME} opacity="0.14" />
      <circle cx="100" cy="62" r="17" fill={FLAME} opacity="0.18" />
      <path d={TUMBLER} fill={GLASS} />
      <path d={WAX} fill={ref(wax)} />
      <ellipse cx="100" cy="92" rx="40" ry="7" fill={p.soft} stroke={p.dark} strokeWidth="1.5" />
      <ellipse cx="100" cy="92" rx="18" ry="3.5" fill={mix(p.fill, "#fff", 0.15)} opacity="0.9" />
      <path
        d="M100 92C99 86 101 82 100 76"
        fill="none"
        stroke={WICK}
        strokeWidth="2.5"
        {...ROUND}
      />
      <path
        d={FLAME_PATH}
        fill={FLAME}
        stroke={mix(FLAME, "#b0400a", 0.5)}
        strokeWidth="1.5"
        {...ROUND}
      />
      <path d="M100 54C104 62 104 68 100 71C96 68 96 62 100 54Z" fill={FLAME_CORE} />
      <path d="M62 118H138V150H62Z" fill={PAPER} />
      <path d="M62 118H138M62 150H138" stroke={p.dark} strokeWidth="1.5" opacity="0.5" />
      <path d="M84 130h32M90 140h20" stroke={p.dark} strokeWidth="2.2" opacity="0.5" {...ROUND} />
      <path
        d="M74 140q4-10 10-12M78 134l-4-2"
        fill="none"
        stroke={GREEN}
        strokeWidth="2"
        {...ROUND}
      />
      <GlassGlints left={60} right={140} top={84} bottom={168} />
      <GlassBase x={64} y={170} width={72} />
      <path d={TUMBLER} fill="none" stroke={p.dark} strokeWidth="3" {...ROUND} />
      <ellipse cx="100" cy="76" rx="42" ry="6" fill="none" stroke={p.dark} strokeWidth="2.5" />
    </ItemFrame>
  );
}
