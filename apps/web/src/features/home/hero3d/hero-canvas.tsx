"use client";

import { useEffect, useRef, useState } from "react";

import { startHero } from "./hero-controller";
import type { HeroController } from "./hero-controller";

/**
 * The lazily loaded WebGL scene: a host element the Three.js renderer fills. Transparent
 * background (the page shows through), pixel ratio capped at 2. `active` false (tab hidden or
 * stage off screen) stops rendering and freezes the animation clock.
 */
export function HeroCanvas({
  active,
  onFirstFrame,
  onContextLost,
}: {
  active: boolean;
  onFirstFrame: () => void;
  onContextLost: () => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<HeroController | null>(null);
  const activeRef = useRef(active);
  const hooksRef = useRef({ onFirstFrame, onContextLost });
  const [error, setError] = useState<unknown>(null);
  if (error) throw error; // caught by the stage's error boundary, which falls back to the poster

  useEffect(() => {
    hooksRef.current = { onFirstFrame, onContextLost };
    activeRef.current = active;
    controllerRef.current?.setActive(active);
  }, [active, onFirstFrame, onContextLost]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    startHero(
      host,
      {
        onFirstFrame: () => hooksRef.current.onFirstFrame(),
        onContextLost: () => hooksRef.current.onContextLost(),
      },
      () => cancelled,
    ).then(
      (controller) => {
        if (!controller) return;
        if (cancelled) {
          controller.dispose();
          return;
        }
        controllerRef.current = controller;
        controller.setActive(activeRef.current);
      },
      (reason: unknown) => {
        if (!cancelled) setError(reason ?? new Error("The hero scene failed to start"));
      },
    );
    return () => {
      cancelled = true;
      controllerRef.current?.dispose();
      controllerRef.current = null;
    };
  }, []);

  return <div ref={hostRef} className="h-full w-full" />;
}
