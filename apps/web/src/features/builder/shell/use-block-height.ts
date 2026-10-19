"use client";

import { useEffect, useState } from "react";
import type { RefObject } from "react";

/** The height of an element, kept up to date as it changes. 0 until it has been measured. */
export function useBlockHeight(ref: RefObject<HTMLElement | null>): number {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => setHeight(element.offsetHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return height;
}
