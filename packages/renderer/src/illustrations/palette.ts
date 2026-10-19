import { shade } from "../placeholders/color";

/** Fixed accents: the gold wrapper band, the green stem, the pink heart. Never tinted. */
export const GOLD = "#D9A92E";
export const GOLD_DARK = shade(GOLD, -0.4);
export const GOLD_LIGHT = shade(GOLD, 0.5);
export const GREEN = "#5B9B6E";
export const GREEN_DARK = shade(GREEN, -0.35);
export const HEART = "#E8467C";
export const PAPER = "#FFFAF6";
export const INK = "#2B1733";

/** Round joins and caps on every outline, as the design recipe asks. */
export const ROUND = { strokeLinecap: "round", strokeLinejoin: "round" } as const;

/** Perceived brightness in [0, 1] of a `#rgb` or `#rrggbb` colour. Unparseable input reads as mid grey. */
export function luma(hex: string): number {
  const digits = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex)?.[1];
  if (!digits) return 0.5;
  const full =
    digits.length === 3
      ? digits
          .split("")
          .map((c) => c + c)
          .join("")
      : digits;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

/** Everything an item illustration needs, derived from the item's one `color`. */
export interface ItemPalette {
  fill: string;
  /** Outline: the fill darkened about 38%. */
  dark: string;
  /** Highlight stripe: the fill lightened 55%. */
  light: string;
  /** Slightly darker than the fill, for the form-shading crescent. */
  deep: string;
  /** Slightly lighter than the fill, for inner petals, bellies and muzzles. */
  soft: string;
}

export function itemPalette(color: string): ItemPalette {
  const veryDark = luma(color) < 0.12;
  return {
    fill: color,
    // Near-black cannot be darkened: its outline and highlight step up so the shape still reads.
    dark: veryDark ? shade(color, 0.3) : shade(color, -0.38),
    light: shade(color, veryDark ? 0.5 : 0.55),
    deep: veryDark ? shade(color, 0.06) : shade(color, -0.12),
    soft: shade(color, 0.4),
  };
}
