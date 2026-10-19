import type { KeyboardEvent } from "react";

/**
 * Tab inside a modal dialog or sheet must wrap, never leave. Base UI leaves the dialog through
 * its focus guards when it was opened with the keyboard, so the modal components call
 * `keepTabInside` from their keydown handler.
 */

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/** Which end to jump to, or null when the browser's own Tab move is fine. Pure so it can be tested. */
export function wrapTarget<T>(options: {
  focusable: readonly T[];
  active: T | null;
  container: T;
  shift: boolean;
}): T | null {
  const { focusable, active, container, shift } = options;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (first === undefined || last === undefined) return null;
  if (shift && (active === first || active === container)) return last;
  if (!shift && active === last) return first;
  return null;
}

export function keepTabInside(event: KeyboardEvent<HTMLElement>): void {
  if (event.key !== "Tab") return;
  const container = event.currentTarget;
  const active = document.activeElement;
  // Focus inside a nested popup (a select list) is that popup's business.
  if (!(active instanceof HTMLElement) || !container.contains(active)) return;
  const focusable = [...container.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (node) => node.getClientRects().length > 0,
  );
  const target = wrapTarget({ focusable, active, container, shift: event.shiftKey });
  if (!target) return;
  event.preventDefault();
  target.focus();
}
