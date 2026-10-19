import { shade } from "../../placeholders/color";
import { luma } from "../palette";

/**
 * Shades of one packaging colour, named by role. Near-black wrappers cannot be darkened and
 * near-white ones cannot be lightened, so those two ends step the other way: panels differ by
 * lifting black a little (or dimming white a little) instead of by the usual darker/lighter pair.
 */
export interface WrapTones {
  /** The colour as chosen. */
  base: string;
  /** Lit panel: lighter than base (base itself on near-white). */
  lit: string;
  /** Mid panel between base and lit. */
  mid: string;
  /** Back layers and interiors, darker than base (a hair lighter on near-black). */
  back: string;
  /** Deepest interior floor. */
  floor: string;
  /** Outline and pleat lines. */
  edge: string;
  /** Fold lines drawn over the panels: dark ink normally, pale on near-black so they still show. */
  fold: string;
}

export function wrapTones(color: string): WrapTones {
  const l = luma(color);
  const dark = l < 0.18;
  const light = l > 0.82;
  return {
    base: color,
    lit: light ? shade(color, -0.04) : shade(color, dark ? 0.32 : 0.5),
    mid: light ? shade(color, -0.1) : shade(color, dark ? 0.16 : 0.18),
    back: light ? shade(color, -0.2) : shade(color, dark ? 0.08 : -0.22),
    floor: light ? shade(color, -0.32) : shade(color, dark ? -0.3 : -0.38),
    edge: shade(color, dark ? -0.7 : -0.42),
    fold: dark ? shade(color, 0.5) : shade(color, -0.42),
  };
}

/** Ribbon shades: fill, outline, highlight and inner loop shadow. */
export interface RibbonTones {
  fill: string;
  tail: string;
  edge: string;
  light: string;
  inner: string;
}

export function ribbonTones(ribbon: string): RibbonTones {
  return {
    fill: ribbon,
    tail: shade(ribbon, -0.08),
    edge: shade(ribbon, -0.34),
    light: shade(ribbon, 0.5),
    inner: shade(ribbon, -0.2),
  };
}
