export type StepFocusInput = {
  /** The path the previous step view was shown at, or null on the first view after a full page load. */
  previousPath: string | null;
  path: string;
  /** True when nothing holds focus (it fell to the page body, as it does when a clicked link unmounts). */
  focusIsLost: boolean;
  hasHeading: boolean;
};

/**
 * Whether to move focus to the step heading. Only after an in-app step change, only when focus was
 * lost, and never on a fresh page load (the skip link and header must stay first for keyboard users).
 */
export function shouldFocusHeading({
  previousPath,
  path,
  focusIsLost,
  hasHeading,
}: StepFocusInput): boolean {
  if (previousPath === null || previousPath === path) return false;
  return focusIsLost && hasHeading;
}
