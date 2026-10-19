"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";

/** Mask that fades the right edge, used only while there is more to scroll to. */
export const EDGE_FADE_CLASS = "[mask-image:linear-gradient(90deg,#000_85%,transparent)]";

/**
 * Tells whether a horizontally scrolling row has more content past its right edge, so the row
 * can fade there. Once scrolled to the end (or when nothing overflows) the fade goes away and
 * the last item is fully visible.
 */
export function useEdgeFade<T extends HTMLElement>(): {
  ref: RefObject<T | null>;
  fade: boolean;
  onScroll: () => void;
} {
  const ref = useRef<T>(null);
  const [fade, setFade] = useState(false);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setFade(el.scrollWidth - el.clientWidth - el.scrollLeft > 4);
  }, []);

  // Children come and go (a category filter), which does not resize the row: measure every render.
  useEffect(update);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [update]);

  return { ref, fade, onScroll: update };
}
