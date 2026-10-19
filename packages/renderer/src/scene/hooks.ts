import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { RefObject } from "react";

import { observeNearViewport, observeWidth } from "./observers";

const subscribeNothing = () => () => undefined;

/** False on the server and during hydration, true afterwards. Never causes a hydration mismatch. */
export function useHasMounted(): boolean {
  return useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );
}

/**
 * Watches the scene's `<svg>`. `onWidth` hears its rendered width in CSS pixels
 * (so callers can pick an image resolution); `nearViewport` gates image fetching.
 * Starts `false` so server and first client render match.
 */
export function useSceneObservers(onWidth: ((width: number) => void) | undefined): {
  ref: RefObject<SVGSVGElement | null>;
  nearViewport: boolean;
} {
  const ref = useRef<SVGSVGElement | null>(null);
  const [nearViewport, setNearViewport] = useState(false);
  const latestOnWidth = useRef(onWidth);

  useEffect(() => {
    latestOnWidth.current = onWidth;
  }, [onWidth]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    const stopSize = observeWidth(element, (width) => latestOnWidth.current?.(width));
    const stopView = observeNearViewport(element, setNearViewport);
    return () => {
      stopSize();
      stopView();
    };
  }, []);

  return { ref, nearViewport };
}
