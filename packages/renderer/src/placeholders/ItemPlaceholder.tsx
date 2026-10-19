import type { ItemShape } from "@giftpop/contracts";
import type { ReactNode } from "react";

import { shade } from "./color";

/** Placeholders are drawn in a 200 x 200 box; the anchor is its centre. */
export const PLACEHOLDER_SIZE = 200;

interface Palette {
  fill: string;
  dark: string;
  light: string;
}

type ShapeRenderer = (p: Palette) => ReactNode;

const SHAPES: Record<ItemShape, ShapeRenderer> = {
  bar: (p) => (
    <>
      <rect
        x="55"
        y="20"
        width="90"
        height="160"
        rx="8"
        fill={p.fill}
        stroke={p.dark}
        strokeWidth="4"
      />
      <path
        d="M55 60H145M55 100H145M55 140H145M100 20V180"
        stroke={p.dark}
        strokeWidth="3"
        opacity="0.45"
      />
    </>
  ),
  bottle: (p) => (
    <>
      <rect x="86" y="8" width="28" height="22" rx="4" fill={p.dark} />
      <path
        d="M88 30H112V60C112 70 140 78 140 100V176C140 184 134 190 126 190H74C66 190 60 184 60 176V100C60 78 88 70 88 60Z"
        fill={p.fill}
        stroke={p.dark}
        strokeWidth="4"
      />
      <rect x="66" y="108" width="68" height="46" rx="4" fill={p.light} opacity="0.8" />
    </>
  ),
  jar: (p) => (
    <>
      <rect x="52" y="22" width="96" height="26" rx="6" fill={p.dark} />
      <rect
        x="44"
        y="48"
        width="112"
        height="136"
        rx="22"
        fill={p.fill}
        stroke={p.dark}
        strokeWidth="4"
      />
      <rect x="58" y="92" width="84" height="48" rx="6" fill={p.light} opacity="0.8" />
    </>
  ),
  box: (p) => (
    <>
      <rect
        x="28"
        y="48"
        width="144"
        height="124"
        rx="8"
        fill={p.fill}
        stroke={p.dark}
        strokeWidth="4"
      />
      <rect x="28" y="48" width="144" height="30" rx="8" fill={p.dark} opacity="0.35" />
      <rect x="92" y="48" width="16" height="124" fill={p.light} opacity="0.8" />
      <path
        d="M100 48C80 16 52 28 70 46M100 48C120 16 148 28 130 46"
        fill="none"
        stroke={p.light}
        strokeWidth="8"
        strokeLinecap="round"
      />
    </>
  ),
  mug: (p) => (
    <>
      <path d="M140 76H162A22 22 0 0 1 162 128H140" fill="none" stroke={p.dark} strokeWidth="12" />
      <path
        d="M36 52H144V150C144 168 130 180 112 180H68C50 180 36 168 36 150Z"
        fill={p.fill}
        stroke={p.dark}
        strokeWidth="4"
      />
      <rect x="36" y="52" width="108" height="14" fill={p.dark} opacity="0.3" />
    </>
  ),
  flower: (p) => (
    <>
      <path d="M100 100V196" stroke="#3f7d4e" strokeWidth="8" strokeLinecap="round" />
      <path d="M100 160C70 156 60 136 62 130C84 130 98 144 100 160Z" fill="#4f9a5f" />
      {[0, 72, 144, 216, 288].map((deg) => (
        <ellipse
          key={deg}
          cx="100"
          cy="58"
          rx="22"
          ry="34"
          fill={p.fill}
          stroke={p.dark}
          strokeWidth="3"
          transform={`rotate(${deg} 100 100)`}
        />
      ))}
      <circle cx="100" cy="100" r="16" fill={p.light} stroke={p.dark} strokeWidth="3" />
    </>
  ),
  card: (p) => (
    <>
      <rect
        x="40"
        y="24"
        width="120"
        height="152"
        rx="6"
        fill={p.fill}
        stroke={p.dark}
        strokeWidth="4"
      />
      <path
        d="M62 70H138M62 98H138M62 126H108"
        stroke={p.dark}
        strokeWidth="5"
        strokeLinecap="round"
        opacity="0.5"
      />
    </>
  ),
  "soft-toy": (p) => (
    <>
      <circle cx="58" cy="40" r="22" fill={p.fill} stroke={p.dark} strokeWidth="4" />
      <circle cx="142" cy="40" r="22" fill={p.fill} stroke={p.dark} strokeWidth="4" />
      <ellipse cx="100" cy="140" rx="52" ry="46" fill={p.fill} stroke={p.dark} strokeWidth="4" />
      <circle cx="100" cy="76" r="44" fill={p.fill} stroke={p.dark} strokeWidth="4" />
      <ellipse cx="100" cy="90" rx="18" ry="13" fill={p.light} />
      <circle cx="84" cy="68" r="5" fill={p.dark} />
      <circle cx="116" cy="68" r="5" fill={p.dark} />
    </>
  ),
  balloon: (p) => (
    <>
      <path d="M100 150C96 168 108 176 100 196" fill="none" stroke={p.dark} strokeWidth="3" />
      <path d="M100 142L90 156H110Z" fill={p.dark} />
      <ellipse cx="100" cy="80" rx="52" ry="64" fill={p.fill} stroke={p.dark} strokeWidth="4" />
      <ellipse
        cx="80"
        cy="56"
        rx="10"
        ry="18"
        fill={p.light}
        opacity="0.7"
        transform="rotate(20 80 56)"
      />
    </>
  ),
  other: (p) => (
    <>
      <rect
        x="40"
        y="40"
        width="120"
        height="120"
        rx="24"
        fill={p.fill}
        stroke={p.dark}
        strokeWidth="4"
      />
      <circle cx="100" cy="100" r="24" fill={p.light} opacity="0.8" />
    </>
  ),
};

/** Inline SVG silhouette for an item with no image, picked by `shape` and tinted by `color`. */
export function ItemPlaceholder({ shape, color }: { shape: ItemShape; color: string }) {
  const palette: Palette = { fill: color, dark: shade(color, -0.4), light: shade(color, 0.55) };
  return <g data-placeholder={shape}>{SHAPES[shape](palette)}</g>;
}
