import { mix, shade } from "../../placeholders/color";
import { INK, luma, PAPER } from "../palette";

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

/**
 * An open box's inside. The floor is lined with pale tissue tinted by the wrapper, so items read
 * against it at thumbnail size; walls in shadow are deepened towards the ink colour, not black,
 * so pinks and creams stay warm instead of turning grey-mauve.
 */
export interface BoxTones {
  /** Tissue lining the floor. */
  tissue: string;
  /** Tissue creases and the crinkled front fold. */
  crease: string;
  /** The inner back wall, in shadow. */
  wall: string;
  /** The inner side walls, a little lighter than the back wall. */
  side: string;
  /** The outside front face below the rim. */
  face: string;
  /** Texture dots on the tissue. */
  dots: string;
  /** Outline of the rim and the box, the wrapper darkened about 38%. */
  edge: string;
}

export function boxTones(color: string): BoxTones {
  // Charcoal and other deep wrappers: walls step lighter and the tissue stays nearly white.
  const dark = luma(color) < 0.35;
  const tissue = mix(PAPER, color, dark ? 0.08 : 0.26);
  return {
    tissue,
    crease: mix(tissue, color, dark ? 0.18 : 0.5),
    wall: dark ? shade(color, 0.14) : mix(color, INK, 0.16),
    side: dark ? shade(color, 0.22) : mix(color, INK, 0.08),
    face: dark ? shade(color, 0.08) : mix(color, INK, 0.1),
    dots: dark ? shade(color, 0.45) : color,
    edge: dark ? shade(color, -0.6) : mix(color, INK, 0.45),
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
