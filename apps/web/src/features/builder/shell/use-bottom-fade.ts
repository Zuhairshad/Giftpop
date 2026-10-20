"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";

/** Fades the bottom 28px of a scroll area, so content visibly continues under the footer. */
export const BOTTOM_FADE_CLASS =
  "[mask-image:linear-gradient(to_bottom,#000_calc(100%-28px),transparent)]";

/** More than a few pixels of content sit below the visible part of a scroll area. */
export function hasMoreBelow(
  scrollHeight: number,
  clientHeight: number,
  scrollTop: number,
): boolean {
  return scrollHeight - clientHeight - scrollTop > 4;
}

/**
 * Tells whether a vertically scrolling area has more content below its bottom edge. Watches the
 * area and its content for size changes (a lazily loaded body, a category filter) and scrolling.
 */
export function useBottomFade<T extends HTMLElement>(
  content: RefObject<HTMLElement | null>,
): { ref: RefObject<T | null>; fade: boolean; onScroll: () => void } {
  const ref = useRef<T>(null);
  const [fade, setFade] = useState(false);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setFade(hasMoreBelow(el.scrollHeight, el.clientHeight, el.scrollTop));
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    if (content.current) observer.observe(content.current);
    return () => observer.disconnect();
  }, [update, content]);

  return { ref, fade, onScroll: update };
}
