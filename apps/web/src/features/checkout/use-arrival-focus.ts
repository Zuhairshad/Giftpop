"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

import { shouldFocusOnArrival } from "./arrival-focus";

const subscribeNever = (): (() => void) => () => {};

/**
 * Moves focus to the page's h1 once `ready` turns true, when checkout was reached by an in-app
 * link. A component that first renders while the page hydrates came from a full page load (the
 * server snapshot is used), so it leaves focus alone.
 */
export function useArrivalFocus(ready: boolean): void {
  const hydrating = useSyncExternalStore(
    subscribeNever,
    () => false,
    () => true,
  );
  // Only the first render's value is kept: how this screen arrived.
  const arrivedInApp = useRef(!hydrating);
  const done = useRef(false);

  useEffect(() => {
    if (!ready || done.current) return;
    done.current = true;
    const heading = document.querySelector<HTMLElement>("#main h1");
    const active = document.activeElement;
    const focusIsLost = !active || active === document.body || !active.isConnected;
    const input = { arrivedInApp: arrivedInApp.current, focusIsLost, hasHeading: heading !== null };
    if (heading && shouldFocusOnArrival(input)) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
  }, [ready]);
}
