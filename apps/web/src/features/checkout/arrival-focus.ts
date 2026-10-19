export interface ArrivalFocusInput {
  /** True when checkout opened by an in-app link (the builder's "Continue to checkout"), false on a full page load. */
  arrivedInApp: boolean;
  /** True when nothing holds focus (it fell to the page body, as it does when a clicked link unmounts). */
  focusIsLost: boolean;
  hasHeading: boolean;
}

/**
 * Whether to move focus to the checkout h1, as the builder moves it to each question title. Only
 * after an in-app arrival that dropped focus; never on a full page load, where the skip link and
 * header must stay first for keyboard users, and never away from a control the visitor chose.
 */
export function shouldFocusOnArrival({
  arrivedInApp,
  focusIsLost,
  hasHeading,
}: ArrivalFocusInput): boolean {
  return arrivedInApp && focusIsLost && hasHeading;
}
