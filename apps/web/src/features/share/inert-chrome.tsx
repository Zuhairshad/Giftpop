"use client";

import { useEffect } from "react";

/** The site header, footer and skip link that the share overlay covers. */
export const COVERED_CHROME = "body > header, body > footer, body > a[href='#main']";

/**
 * The share page paints a full-screen layer over the site chrome. Without `inert` the covered links
 * stay in the tab order with no visible ring, so keyboard users tab through nine invisible stops.
 * Renders nothing; restores the chrome when the page unmounts.
 */
export function InertChrome(): null {
  useEffect(() => {
    const covered = Array.from(document.querySelectorAll<HTMLElement>(COVERED_CHROME)).filter(
      (element) => !element.inert,
    );
    covered.forEach((element) => {
      element.inert = true;
    });
    return () => {
      covered.forEach((element) => {
        element.inert = false;
      });
    };
  }, []);
  return null;
}
