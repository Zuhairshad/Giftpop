import type { ReactNode } from "react";

import { shade } from "./color";

interface Colors {
  wrapper: string;
  ribbon: string;
}

interface PackagingArt {
  back: (c: Colors) => ReactNode;
  front: (c: Colors) => ReactNode;
}

const NONE = () => null;

/**
 * Placeholder wrapper art for packaging with no layer images, keyed by layout
 * type. Purely cosmetic: a layout type with no entry here falls back to a plain
 * tray, so adding a layout never requires touching this file.
 */
const ART: Record<string, PackagingArt> = {
  "bouquet-fan": {
    back: NONE,
    front: ({ wrapper, ribbon }) => (
      <g>
        <path
          d="M120 600L500 575L880 600L610 960H390Z"
          fill={wrapper}
          stroke={shade(wrapper, -0.3)}
          strokeWidth="6"
        />
        <path d="M500 575L430 960H390L120 600Z" fill={shade(wrapper, 0.2)} opacity="0.5" />
        <rect x="396" y="742" width="208" height="34" rx="8" fill={ribbon} />
        <path d="M500 742C440 700 400 716 430 760M500 742C560 700 600 716 570 760" fill={ribbon} />
      </g>
    ),
  },
  "box-grid": {
    back: ({ wrapper }) => (
      <g>
        <rect
          x="80"
          y="80"
          width="840"
          height="840"
          rx="28"
          fill={wrapper}
          stroke={shade(wrapper, -0.35)}
          strokeWidth="8"
        />
        <rect x="120" y="120" width="760" height="760" rx="12" fill={shade(wrapper, -0.15)} />
      </g>
    ),
    front: ({ ribbon }) => (
      <rect x="80" y="470" width="840" height="60" fill={ribbon} opacity="0.85" />
    ),
  },
};

const FALLBACK: PackagingArt = {
  back: ({ wrapper }) => (
    <rect x="80" y="80" width="840" height="840" rx="28" fill={wrapper} opacity="0.5" />
  ),
  front: NONE,
};

export function PackagingBackPlaceholder({
  layoutType,
  ...colors
}: Colors & { layoutType: string }) {
  return <>{(ART[layoutType] ?? FALLBACK).back(colors)}</>;
}

export function PackagingFrontPlaceholder({
  layoutType,
  ...colors
}: Colors & { layoutType: string }) {
  return <>{(ART[layoutType] ?? FALLBACK).front(colors)}</>;
}
