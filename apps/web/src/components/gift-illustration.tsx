import type { ItemShape } from "@giftpop/contracts";
import { ItemIllustrationSvg } from "@giftpop/renderer";
import { useId } from "react";
import type { ReactElement } from "react";

type GiftIllustrationProps = { className?: string };

/**
 * Fixed object colours (bubblegum box, lavender ribbon, gold piping), with the recipe's shades
 * precomputed: dark = fill darkened 38%, light = lightened 55%, deep = darkened 12%.
 */
const GIFT_ART = {
  box: "#F7A1C4",
  boxDark: "#99647A",
  boxLight: "#FBD5E4",
  boxDeep: "#D98EAC",
  lid: "#FAB6D2",
  ribbon: "#9468E8",
  ribbonDark: "#5C4090",
  ribbonLight: "#CFBBF5",
  ribbonDeep: "#6F4EAE",
  gold: "#E3B93C",
  goldDark: "#8D7325",
  kraft: "#C69C6D",
  paper: "#FFFAF6",
  tagLine: "#B08A63",
  ink: "#2B1733",
  shadow: "#2B1733",
} as const;

interface FloaterDef {
  shape: ItemShape;
  color: string;
  /** Centre in the 400 x 400 art, size of the 200 px item art, tilt in degrees, float phase in s. */
  x: number;
  y: number;
  size: number;
  rotate: number;
  delay: number;
}

/** A few items drifting out of the box, drawn with the same illustrations as the item tiles. */
const GIFT_FLOATERS: readonly FloaterDef[] = [
  { shape: "flower", color: "#E8467C", x: 78, y: 118, size: 104, rotate: -12, delay: 0 },
  { shape: "balloon", color: "#F2B640", x: 326, y: 92, size: 108, rotate: 8, delay: -2.1 },
  { shape: "bar", color: "#7A4A2E", x: 62, y: 256, size: 84, rotate: -16, delay: -3.4 },
  { shape: "soft-toy", color: "#D9A877", x: 352, y: 290, size: 92, rotate: 10, delay: -1.2 },
];

/** Gift tags and stickers use the script accent font (design doc, Typography). */
const SCRIPT_FONT = "var(--font-script, 'Caveat'), 'Segoe Script', cursive";

/** Each floater drifts on its own phase; the CSS lives inside the SVG so the art carries it along. */
const FLOAT_CSS = `
@keyframes gp-gift-float { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-7px) rotate(1.5deg); } }
@media (prefers-reduced-motion: no-preference) {
  .gp-gift-floater { animation: gp-gift-float 6s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
}`;

function Floater({ shape, color, x, y, size, rotate, delay }: FloaterDef): ReactElement {
  return (
    <g
      transform={`translate(${x - size / 2} ${y - size / 2}) rotate(${rotate} ${size / 2} ${size / 2})`}
    >
      <g className="gp-gift-floater" style={{ animationDelay: `${delay}s` }}>
        <ItemIllustrationSvg shape={shape} color={color} size={size} />
      </g>
    </g>
  );
}

function Sparkle({ x, y, r }: { x: number; y: number; r: number }): ReactElement {
  const d = `M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r}Z`;
  return (
    <path
      d={d}
      fill={GIFT_ART.gold}
      stroke={GIFT_ART.goldDark}
      strokeWidth={1.5}
      strokeLinejoin="round"
    />
  );
}

/**
 * The overview before a packaging is chosen: a closed gift box with a ribbon bow and a few items
 * floating around it, in the illustration recipe (flat fill, outline 38% darker, one highlight
 * stripe, dot texture). Illustration colours are objects, so they stay the same in dark mode.
 * Decorative: the caption under the overview says what to do.
 */
export function GiftIllustration({ className }: GiftIllustrationProps): ReactElement {
  const dots = `gp-gift-dots-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const a = GIFT_ART;
  const ribbon = {
    fill: a.ribbon,
    stroke: a.ribbonDark,
    strokeWidth: 3,
    strokeLinejoin: "round",
  } as const;
  return (
    <svg
      viewBox="0 0 400 400"
      className={className}
      aria-hidden="true"
      focusable="false"
      data-illustration="empty-gift"
    >
      <style>{FLOAT_CSS}</style>
      <defs>
        <pattern id={dots} width="18" height="18" patternUnits="userSpaceOnUse">
          <circle cx="4" cy="5" r="2.2" fill={a.boxDark} opacity="0.25" />
          <circle cx="13" cy="14" r="2.2" fill={a.boxDark} opacity="0.25" />
        </pattern>
      </defs>

      {/* Contact shadow */}
      <ellipse cx="200" cy="336" rx="118" ry="13" fill={a.shadow} opacity="0.1" />

      {/* Box body: fill, form-shading crescent on the right, dots, highlight stripe, outline */}
      <path d="M112 192 H288 V318 a12 12 0 0 1 -12 12 H124 a12 12 0 0 1 -12 -12 Z" fill={a.box} />
      <path d="M252 192 H288 V318 a12 12 0 0 1 -12 12 H252 Z" fill={a.boxDeep} />
      <path
        d="M112 192 H288 V318 a12 12 0 0 1 -12 12 H124 a12 12 0 0 1 -12 -12 Z"
        fill={`url(#${dots})`}
      />
      <rect x="126" y="212" width="10" height="100" rx="5" fill={a.boxLight} opacity="0.55" />
      <path
        d="M112 192 H288 V318 a12 12 0 0 1 -12 12 H124 a12 12 0 0 1 -12 -12 Z"
        fill="none"
        stroke={a.boxDark}
        strokeWidth="3"
        strokeLinejoin="round"
      />

      {/* Lid */}
      <rect
        x="100"
        y="160"
        width="200"
        height="40"
        rx="10"
        fill={a.lid}
        stroke={a.boxDark}
        strokeWidth="3"
      />
      <rect x="114" y="168" width="64" height="7" rx="3.5" fill={a.boxLight} opacity="0.55" />
      <path
        d="M103 196 H297"
        stroke={a.boxDark}
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.35"
      />

      {/* Ribbon band with gold piping, over the lid and down the front */}
      <rect x="186" y="160" width="28" height="170" {...ribbon} />
      <path
        d="M191 164 V326 M209 164 V326"
        stroke={a.gold}
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Bow: notched tails, hollow loops, knot */}
      <path d="M194 166 L166 214 L178 210 L182 223 L206 172 Z" {...ribbon} />
      <path d="M206 166 L234 214 L222 210 L218 223 L194 172 Z" {...ribbon} />
      <path d="M200 160 C176 112 124 112 132 144 C138 168 178 168 200 160 Z" {...ribbon} />
      <path d="M190 156 C172 128 146 128 150 144 C154 156 176 158 190 156 Z" fill={a.ribbonDeep} />
      <path d="M200 160 C224 112 276 112 268 144 C262 168 222 168 200 160 Z" {...ribbon} />
      <path d="M210 156 C228 128 254 128 250 144 C246 156 224 158 210 156 Z" fill={a.ribbonDeep} />
      <path
        d="M150 126 C160 120 172 122 180 130"
        stroke={a.ribbonLight}
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
        opacity="0.7"
      />
      <rect x="187" y="146" width="26" height="24" rx="9" {...ribbon} />

      {/* Gift tag on a string from the knot */}
      <path
        d="M212 166 Q236 188 246 230"
        stroke={a.kraft}
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      <g transform="rotate(-8 270 246)">
        <path
          d="M236 230 H306 V262 H244 L236 254 Z"
          fill={a.paper}
          stroke={a.tagLine}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <circle cx="246" cy="240" r="3.5" fill="none" stroke={a.tagLine} strokeWidth="2" />
        <text
          x="275"
          y="253"
          textAnchor="middle"
          fontSize="19"
          fontWeight="700"
          fill={a.ink}
          style={{ fontFamily: SCRIPT_FONT }}
        >
          For you
        </text>
      </g>

      <Sparkle x={86} y={208} r={9} />
      <Sparkle x={318} y={168} r={7} />
      <Sparkle x={206} y={64} r={8} />
      <Sparkle x={52} y={300} r={6} />

      {GIFT_FLOATERS.map((floater) => (
        <Floater key={floater.shape} {...floater} />
      ))}
    </svg>
  );
}
