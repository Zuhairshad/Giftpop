/** Longest any item move or fade may take. */
export const MOTION_MAX_MS = 400;

/** Spring for moving an item to its slot. `duration` is the whole settle time, in seconds. */
export const SLOT_SPRING = { type: "spring", duration: 0.34, bounce: 0.12 } as const;

/** Fade for items entering and leaving. */
export const FADE = { duration: 0.2, ease: "easeOut" } as const;

/** Entering items grow from this scale to full size. */
export const ENTER_SCALE = 0.6;

export interface ItemMotionProps {
  initial: false | { opacity: number };
  animate: { opacity: number };
  exit?: { opacity: number };
  transition: { duration: number } | typeof FADE;
}

/**
 * Presence props for an item group. Under reduced motion there is nothing to
 * animate: no entry fade, no exit (so an item leaves at once), zero duration.
 */
export function itemMotionProps(reduced: boolean, entering: boolean): ItemMotionProps {
  if (reduced) return { initial: false, animate: { opacity: 1 }, transition: { duration: 0 } };
  return {
    initial: entering ? { opacity: 0 } : false,
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: FADE,
  };
}
