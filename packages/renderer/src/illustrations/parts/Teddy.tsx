import { shade } from "../../placeholders/color";
import { HEART, ROUND } from "../palette";
import type { ItemPalette } from "../palette";

/** A sole pad with three toe beans, in the lighter fur tone. */
export function PawPad({ x, y, p }: { x: number; y: number; p: ItemPalette }) {
  return (
    <g fill={p.soft} stroke={p.dark} strokeWidth="1.2">
      <ellipse cx={x} cy={y + 2} rx="9" ry="7" />
      <circle cx={x - 8} cy={y - 8} r="3" />
      <circle cx={x} cy={y - 10} r="3" />
      <circle cx={x + 8} cy={y - 8} r="3" />
    </g>
  );
}

/** Short fur strokes in the shade tone, around the cheeks and tummy. */
export function FurTufts({ p }: { p: ItemPalette }) {
  return (
    <path
      d="M62 82l-4 3M64 92l-4 2M138 82l4 3M136 92l4 2M66 132l-4 2M134 132l4 2M72 150l-3 3M128 150l3 3"
      fill="none"
      stroke={p.dark}
      strokeWidth="1.6"
      opacity="0.45"
      {...ROUND}
    />
  );
}

/** A satin bow at the neck. The bow is a fixed pink accent, like a real teddy ribbon. */
export function Bowtie({ x, y }: { x: number; y: number }) {
  const dark = shade(HEART, -0.32);
  return (
    <g transform={`translate(${x} ${y})`} stroke={dark} strokeWidth="2" {...ROUND}>
      <path d="M0 0L-18 -9Q-22 0 -18 9Z" fill={HEART} />
      <path d="M0 0L18 -9Q22 0 18 9Z" fill={HEART} />
      <path d="M-14 -4Q-10 0 -14 4M14 -4Q10 0 14 4" fill="none" opacity="0.6" />
      <ellipse rx="5" ry="5.5" fill={shade(HEART, 0.15)} />
    </g>
  );
}
