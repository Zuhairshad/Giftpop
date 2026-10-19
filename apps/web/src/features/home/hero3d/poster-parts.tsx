import { ItemIllustrationSvg } from "@giftpop/renderer";

import { shade } from "./color";
import { LID_REST, PALETTE } from "./constants";
import { BowArt, StickerArt, StickerText } from "./decor";
import { SPRITES } from "./sprites";
import type { SpriteDef } from "./sprites";

/** The SVG pieces of the poster: the box, its interior, the lid, the sticker and the item sprites. */
const RIBBON_DARK = shade(PALETTE.lavender, -0.35);
const TISSUE_DARK = shade(PALETTE.tissue, -0.3);

function spriteById(id: string): SpriteDef {
  const def = SPRITES.find((s) => s.id === id);
  if (!def) throw new Error(`Unknown hero sprite: ${id}`);
  return def;
}

export function SpriteItem({ id }: { id: string }) {
  const def = spriteById(id);
  return (
    <g
      transform={`translate(${def.x} ${def.y}) rotate(${def.rotDeg}) scale(${def.scale}) translate(-100 -100)`}
    >
      {def.shape ? <ItemIllustrationSvg shape={def.shape} color={def.color} size={200} /> : null}
    </g>
  );
}

export function BoxBody({ dots }: { dots: string }) {
  const { body, bodyDark, bodyLight, ribbon, gold } = PALETTE;
  const bodyPath = "M212 380 H548 V592 a16 16 0 0 1 -16 16 H228 a16 16 0 0 1 -16 -16z";
  return (
    <>
      <path d={bodyPath} fill={body} stroke={bodyDark} strokeWidth={4} />
      <path d={bodyPath} fill={`url(#${dots})`} />
      <rect
        x={206}
        y={372}
        width={348}
        height={26}
        rx={8}
        fill={bodyLight}
        stroke={bodyDark}
        strokeWidth={4}
      />
      <rect x={224} y={410} width={12} height={176} rx={6} fill="#fff" opacity={0.22} />
      <rect
        x={352}
        y={398}
        width={58}
        height={210}
        fill={ribbon}
        stroke={RIBBON_DARK}
        strokeWidth={4}
      />
      <rect
        x={360}
        y={404}
        width={9}
        height={198}
        rx={4.5}
        fill={shade(ribbon, 0.6)}
        opacity={0.6}
      />
      <path d="M356 400 V606 M406 400 V606" stroke={gold} strokeWidth={2.5} opacity={0.95} />
      <rect
        x={352}
        y={372}
        width={58}
        height={26}
        fill={ribbon}
        stroke={RIBBON_DARK}
        strokeWidth={4}
      />
      <path
        d="M410 400 C436 430 452 470 454 520 L474 548 L446 556 L440 586 C424 520 418 470 410 440z"
        fill={shade(ribbon, -0.06)}
        stroke={RIBBON_DARK}
        strokeWidth={4}
        strokeLinejoin="round"
      />
      <path
        d="M352 400 C326 424 306 464 300 508 L278 536 L308 540 L316 570 C332 520 346 470 352 440z"
        fill={ribbon}
        stroke={RIBBON_DARK}
        strokeWidth={4}
        strokeLinejoin="round"
      />
    </>
  );
}

export function Interior() {
  return (
    <>
      <path d="M244 336 H516 L536 380 H224z" fill="#3A2A44" />
      <path d="M244 336 L224 380 H212 L236 330z" fill="#241830" />
      <path d="M516 336 L536 380 H548 L524 330z" fill="#241830" />
      <path
        d="M252 340 H508"
        stroke={shade(PALETTE.bodyLight, 0.2)}
        strokeWidth={3}
        opacity={0.35}
        strokeLinecap="round"
      />
      <path
        d="M236 372 q14 -22 30 -6 q14 -22 30 -4 q16 -20 30 -2 q16 -20 32 -2 q16 -22 32 -2 q16 -18 32 -2 q18 -20 34 0 L536 384 H224z"
        fill={PALETTE.tissue}
        stroke={TISSUE_DARK}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
    </>
  );
}

export function Lid({ dots }: { dots: string }) {
  const { bodyLight, bodyDark, ribbon, gold } = PALETTE;
  return (
    <g transform={`translate(330 120) rotate(${-LID_REST.rotDeg})`}>
      <rect
        x={-140}
        y={0}
        width={280}
        height={70}
        rx={12}
        fill={bodyLight}
        stroke={bodyDark}
        strokeWidth={4}
      />
      <rect x={-140} y={0} width={280} height={70} rx={12} fill={`url(#${dots})`} />
      <rect x={-128} y={10} width={10} height={46} rx={5} fill="#fff" opacity={0.25} />
      <rect
        x={-132}
        y={6}
        width={264}
        height={58}
        rx={8}
        fill="none"
        stroke={gold}
        strokeWidth={2.5}
        opacity={0.9}
      />
      <rect x={-132} y={70} width={264} height={14} rx={6} fill={bodyDark} opacity={0.4} />
      <rect
        x={-29}
        y={0}
        width={58}
        height={70}
        fill={ribbon}
        stroke={RIBBON_DARK}
        strokeWidth={4}
      />
      <path d="M-24 2 V68 M24 2 V68" stroke={gold} strokeWidth={2.5} />
      <g transform="translate(0 2)">
        <BowArt ribbon={ribbon} scale={0.5} />
      </g>
    </g>
  );
}

export function Sticker() {
  const def = spriteById("sticker");
  return (
    <g transform={`translate(${def.x} ${def.y}) rotate(${def.rotDeg}) scale(${def.scale})`}>
      <StickerArt />
      <StickerText />
    </g>
  );
}
