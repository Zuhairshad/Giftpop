import { shade } from "./color";
import { PALETTE } from "./constants";

/**
 * SVG fragments of the hero poster that are not item illustrations: the ribbon bow, the die-cut
 * sticker topper, the gift tag and the sparkles. The poster draws them inline and the 3D scene
 * renders the same fragments to textures, so the two never drift apart.
 * Text is NOT part of these fragments: the poster draws it with the page's script font and the
 * texture builder draws it on a canvas with the same font (an SVG used as an image cannot load fonts).
 */

export interface TextLabel {
  text: string;
  x: number;
  y: number;
  size: number;
}

/** Sticker label positions in the sticker's own coordinates (origin at the heart's centre). */
export const STICKER_LABELS: readonly TextLabel[] = [
  { text: "Happy", x: 0, y: 14, size: 34 },
  { text: "B-day!", x: 0, y: 40, size: 30 },
];
export const STICKER_TEXT_COLOR = "#7A1F4E";

export const TAG_TEXT_COLOR = "#2B1733";
export const tagLabel = (text: string, width: number): TextLabel => ({
  text,
  x: width / 2 + 8,
  y: 46,
  size: width >= 140 ? 32 : 28,
});

export const SCRIPT_FONT = "var(--font-script, 'Caveat'), 'Segoe Script', cursive";

const HEART =
  "M-62 4 Q-62 -34 -22 -34 Q0 -34 0 -14 Q0 -34 22 -34 Q62 -34 62 4 Q62 32 0 74 Q-62 32 -62 4z";

export function StickerArt() {
  return (
    <g>
      <path d="M0 70 L0 130" stroke="#C69C6D" strokeWidth={5} strokeLinecap="round" />
      <path d={HEART} fill="#fff" stroke="#fff" strokeWidth={14} strokeLinejoin="round" />
      <path d={HEART} fill={PALETTE.blob} stroke="#AE3F78" strokeWidth={3} />
    </g>
  );
}

export function StickerText() {
  return (
    <>
      {STICKER_LABELS.map((l) => (
        <text
          key={l.text}
          x={l.x}
          y={l.y}
          textAnchor="middle"
          fontWeight={700}
          fontSize={l.size}
          fill={STICKER_TEXT_COLOR}
          style={{ fontFamily: SCRIPT_FONT }}
        >
          {l.text}
        </text>
      ))}
    </>
  );
}

export function GiftTagArt({ width }: { width: number }) {
  return (
    <g>
      <path
        d={`M0 0 L${width} 0 L${width} 70 L12 70 L0 58z`}
        fill="#FFFAF3"
        stroke="#B08A63"
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <circle cx={14} cy={14} r={5} fill="#FFF1E2" stroke="#B08A63" strokeWidth={2.5} />
    </g>
  );
}

export function GiftTagText({ text, width }: { text: string; width: number }) {
  const l = tagLabel(text, width);
  return (
    <text
      x={l.x}
      y={l.y}
      textAnchor="middle"
      fontWeight={700}
      fontSize={l.size}
      fill={TAG_TEXT_COLOR}
      style={{ fontFamily: SCRIPT_FONT }}
    >
      {l.text}
    </text>
  );
}

export function PolaroidArt() {
  return (
    <g>
      <rect
        x={-30}
        y={-36}
        width={60}
        height={72}
        rx={3}
        fill="#fff"
        stroke="#D9CBD8"
        strokeWidth={2}
      />
      <rect x={-24} y={-30} width={48} height={46} fill="#F6C7D8" />
      <circle cx={0} cy={-12} r={9} fill="#F57FAD" />
      <path d="M-24 16 L-8 -2 L4 8 L12 0 L24 14 V16z" fill="#CDB5F5" />
      <g transform="rotate(-4)">
        <rect x={-18} y={-44} width={36} height={14} fill={PALETTE.gold} opacity={0.85} />
        <path
          d="M-12 -44 l4 14 M0 -44 l4 14 M12 -44 l4 14"
          stroke="#fff"
          strokeWidth={2}
          opacity={0.6}
        />
      </g>
    </g>
  );
}

export function TrufflesArt() {
  const dark = "#9A7418";
  return (
    <g>
      <circle cx={516} cy={362} r={17} fill={PALETTE.gold} stroke={dark} strokeWidth={2.5} />
      <path
        d="M505 354 q8 -8 16 -3"
        stroke="#FFF1B8"
        strokeWidth={4}
        fill="none"
        strokeLinecap="round"
      />
      <circle cx={482} cy={368} r={15} fill={PALETTE.gold} stroke={dark} strokeWidth={2.5} />
      <path
        d="M473 361 q7 -7 14 -3"
        stroke="#FFF1B8"
        strokeWidth={4}
        fill="none"
        strokeLinecap="round"
      />
    </g>
  );
}

/** A four-point sparkle centred on its origin, 24 units wide at scale 1. */
export const STAR_PATH =
  "M0 -12 C1.5 -4 4 -1.5 12 0 C4 1.5 1.5 4 0 12 C-1.5 4 -4 1.5 -12 0 C-4 -1.5 -1.5 -4 0 -12z";

export function StarArt({ fill }: { fill: string }) {
  return <path d={STAR_PATH} fill={fill} />;
}

/** The bow: two hollow loops, a knot and two notched tails, centred on its knot. */
export function BowArt({
  ribbon = PALETTE.ribbon,
  scale = 1,
}: {
  ribbon?: string;
  scale?: number;
}) {
  const rd = shade(ribbon, -0.34);
  const rl = shade(ribbon, 0.5);
  const ri = shade(ribbon, -0.2);
  const stroke = { stroke: rd, strokeWidth: 4, strokeLinejoin: "round" } as const;
  return (
    <g transform={`scale(${scale})`}>
      <path
        d="M-6 10 C-30 46 -52 84 -66 128 L-46 116 L-36 138 C-22 98 -10 58 2 20z"
        fill={shade(ribbon, -0.08)}
        {...stroke}
      />
      <path
        d="M6 10 C34 46 58 80 76 120 L54 112 L50 136 C32 98 14 58 -2 20z"
        fill={ribbon}
        {...stroke}
      />
      <path d="M0 0 C-34 -78 -146 -78 -136 -8 C-130 40 -48 38 0 0z" fill={ribbon} {...stroke} />
      <path d="M-14 -6 C-40 -48 -106 -50 -104 -16 C-102 12 -48 18 -14 -6z" fill={ri} />
      <path d="M0 0 C34 -78 146 -78 136 -8 C130 40 48 38 0 0z" fill={ribbon} {...stroke} />
      <path d="M14 -6 C40 -48 106 -50 104 -16 C102 12 48 18 14 -6z" fill={ri} />
      <path
        d="M-118 -30 q26 -22 62 -10 M118 -30 q-26 -22 -62 -10"
        stroke={rl}
        strokeWidth={5}
        fill="none"
        strokeLinecap="round"
        opacity={0.75}
      />
      <path
        d="M-124 -22 C-120 14 -60 28 -22 4 M124 -22 C120 14 60 28 22 4"
        stroke={PALETTE.gold}
        strokeWidth={2.5}
        fill="none"
        strokeLinecap="round"
        opacity={0.9}
      />
      <rect
        x={-23}
        y={-23}
        width={46}
        height={46}
        rx={16}
        fill={shade(ribbon, -0.05)}
        {...stroke}
      />
      <path
        d="M-11 -11 q9 -7 20 -2"
        stroke={rl}
        strokeWidth={4}
        fill="none"
        strokeLinecap="round"
        opacity={0.8}
      />
    </g>
  );
}
