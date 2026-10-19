/**
 * Motion tokens (docs/design/giftpop-DESIGN.md). Springs are for the builder; the CSS durations live in
 * tokens.css. Every animation must also have a reduced-motion form (cross-fade or none).
 */
export const SPRING = {
  /** Question changes, sheet height, items entering the overview (about 320 ms). */
  question: { type: "spring", stiffness: 380, damping: 34 },
  /** Small pops: quantity badge, selection ring. */
  pop: { type: "spring", stiffness: 520, damping: 32 },
} as const;

export const REDUCED_FADE = { duration: 0.12 } as const;

/** Distance a question travels when it enters or leaves, in px. */
export const QUESTION_SHIFT = 24;
