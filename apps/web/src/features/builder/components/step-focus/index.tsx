"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { shouldFocusHeading } from "./decide";

// Survives the build to checkout layout swap, so that move counts as a step change too.
let lastPath: string | null = null;

/**
 * Renders nothing. After a step change inside the builder it moves focus to the new page's h1, so a
 * keyboard user does not have to Tab through the header and country banner on every step.
 */
export function StepFocus(): null {
  const path = usePathname();
  useEffect(() => {
    const heading = document.querySelector<HTMLElement>("#main h1");
    const active = document.activeElement;
    const focusIsLost = !active || active === document.body || !active.isConnected;
    if (
      heading &&
      shouldFocusHeading({ previousPath: lastPath, path, focusIsLost, hasHeading: true })
    ) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
    lastPath = path;
  }, [path]);
  return null;
}
