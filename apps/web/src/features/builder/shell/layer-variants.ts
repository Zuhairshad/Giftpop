import type { Variants } from "motion/react";

import { layerOffset } from "./transitions";
import type { Direction } from "./transitions";

import { QUESTION_SHIFT, REDUCED_FADE, SPRING } from "@/styles/motion";

/** Passed to every layer through `AnimatePresence custom`, so a leaving layer sees the latest direction. */
export interface LayerCustom {
  direction: Direction;
  /** True for a restore from saved state: swap at once, no movement. */
  instant: boolean;
}

const NONE = { duration: 0 } as const;

/**
 * Entering content comes from the right 24px with opacity and leaving content goes left (Back mirrors).
 * Reduced motion: a 120 ms cross-fade, no movement. Transform and opacity only.
 */
export function layerVariants(reduced: boolean): Variants {
  const move = reduced ? REDUCED_FADE : SPRING.question;
  const fade = reduced ? REDUCED_FADE : { duration: 0.16 };
  return {
    enter: ({ direction }: LayerCustom) => ({
      opacity: 0,
      x: layerOffset(direction, "enter", QUESTION_SHIFT, reduced),
    }),
    center: ({ instant }: LayerCustom) => ({
      opacity: 1,
      x: 0,
      transition: instant ? NONE : { x: move, opacity: fade },
    }),
    exit: ({ direction, instant }: LayerCustom) => ({
      opacity: 0,
      x: layerOffset(direction, "exit", QUESTION_SHIFT, reduced),
      transition: instant ? NONE : { x: move, opacity: fade },
    }),
  };
}
