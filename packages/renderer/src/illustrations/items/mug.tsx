import { mix } from "../../placeholders/color";
import {
  CHOCOLATE,
  CHOCOLATE_LIGHT,
  GOLD,
  GREEN,
  itemPalette,
  PAPER,
  ROUND,
  WOOD,
} from "../palette";
import { cylinderStops, Linear, ref } from "../parts/gradients";
import { useArtId } from "../parts/ids";
import { ItemFrame } from "../parts/ItemFrame";
import type { ItemIllustrationProps } from "../types";

const BODY = "M52 72H136V156a16 16 0 0 1-16 16H68a16 16 0 0 1-16-16Z";
const HANDLE = "M134 92C164 86 166 140 134 144";
const FOOT = "M52 160Q94 170 136 160V172H52Z";
const PETALS = [0, 60, 120, 180, 240, 300];

function Daisy({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {PETALS.map((a) => (
        <ellipse
          key={a}
          cx="0"
          cy={-r}
          rx={r * 0.45}
          ry={r * 0.75}
          fill={PAPER}
          transform={`rotate(${a})`}
        />
      ))}
      <circle r={r * 0.45} fill={GOLD} />
    </g>
  );
}

/** A glazed ceramic mug: glossy body, white-glazed inside with coffee, an unglazed foot ring. */
export function MugIllustration({ color }: ItemIllustrationProps) {
  const p = itemPalette(color);
  const glaze = useArtId("mug-glaze", color);
  const clip = useArtId("mug-clip", BODY);
  const stroke = { fill: "none", ...ROUND };
  return (
    <ItemFrame shape="mug" fit={[1.48, -6.9, -25.2]}>
      <defs>
        <Linear id={glaze} stops={cylinderStops(p)} />
        <clipPath id={clip}>
          <path d={BODY} />
        </clipPath>
      </defs>
      <path d={HANDLE} {...stroke} stroke={p.dark} strokeWidth="17" />
      <path d={HANDLE} {...stroke} stroke={p.fill} strokeWidth="11" />
      <path
        d="M140 94C156 94 160 116 154 128"
        {...stroke}
        stroke={p.shine}
        strokeWidth="2.5"
        opacity="0.7"
      />
      <path d={BODY} fill={ref(glaze)} />
      <path d={FOOT} fill={mix(PAPER, WOOD, 0.4)} clipPath={ref(clip)} />
      <path d={BODY} {...stroke} stroke={p.dark} strokeWidth="3" />
      <path
        d="M52 160Q94 170 136 160"
        {...stroke}
        stroke={p.dark}
        strokeWidth="1.5"
        opacity="0.6"
      />
      <ellipse
        cx="94"
        cy="72"
        rx="42"
        ry="10"
        fill={mix(PAPER, "#000", 0.08)}
        stroke={p.dark}
        strokeWidth="3"
      />
      <ellipse cx="94" cy="75" rx="36" ry="6.5" fill={CHOCOLATE} />
      <ellipse
        cx="90"
        cy="74"
        rx="22"
        ry="3.2"
        fill="none"
        stroke={CHOCOLATE_LIGHT}
        strokeWidth="2"
        opacity="0.8"
      />
      <Daisy x={86} y={118} r={9} />
      <Daisy x={110} y={134} r={6} />
      <path d="M95 128q6 6 10 4M76 130q-4 8 2 12" {...stroke} stroke={GREEN} strokeWidth="2.5" />
      <path d="M62 84V152" {...stroke} stroke="#fff" strokeWidth="6" opacity="0.45" />
      <path d="M70 86V112" {...stroke} stroke="#fff" strokeWidth="2" opacity="0.6" />
      <path d="M128 92V124" {...stroke} stroke="#fff" strokeWidth="2.5" opacity="0.25" />
    </ItemFrame>
  );
}
