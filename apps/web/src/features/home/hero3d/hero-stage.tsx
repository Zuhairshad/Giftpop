"use client";

import { lazy, Suspense, useCallback, useEffect, useReducer, useRef, useState } from "react";

import { hasWebGL, REDUCED_MOTION_QUERY, whenLoadedThenIdle } from "./capabilities";
import {
  POSTER_VIEWBOX,
  START_AFTER_LOAD_MS,
  START_IDLE_TIMEOUT_MS,
  STATIC_FALLBACK_MS,
} from "./constants";
import { HeroErrorBoundary } from "./hero-error-boundary";
import { Poster } from "./poster";
import { nextStagePhase, posterForeground } from "./stage-phase";

import { cn } from "@/lib/cn";

// The Three.js scene is a separate chunk. It is imported here, in a client module, and only
// rendered after hydration and load, so no route's first-load JavaScript contains it.
const HeroCanvas = lazy(() => import("./hero-canvas").then((m) => ({ default: m.HeroCanvas })));

/** The box is still above the frame on the first frame, so a short fade only hides the swap. */
const FADE_MS = 150;

/**
 * The home hero. First paint is the headline (HTML, the LCP) and an empty stage: the pink
 * backdrop and a soft pool of shadow on the floor. Once the page has loaded and the browser is
 * idle, if motion is allowed and hardware WebGL works, the 3D scene starts and the box drops in,
 * bounces, opens and bursts. Reduced motion (straight from CSS, before any script), no WebGL, an
 * error or a scene that never starts shows the SVG composition instead, without motion.
 */
export function HeroStage({ className }: { className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [phase, dispatch] = useReducer(nextStagePhase, "pending");
  const [onScreen, setOnScreen] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);

  useEffect(() => {
    const query = window.matchMedia(REDUCED_MOTION_QUERY);
    const sync = () => dispatch({ type: "reduced-motion", reduced: query.matches });
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  // While pending: wait for load and idle, test WebGL, wait for a visible tab, then arm the canvas.
  useEffect(() => {
    if (phase !== "pending") return;
    let stopVisible: (() => void) | undefined;
    const stopIdle = whenLoadedThenIdle(
      window,
      START_AFTER_LOAD_MS,
      () => {
        if (window.matchMedia(REDUCED_MOTION_QUERY).matches) return;
        if (!hasWebGL(document)) {
          dispatch({ type: "no-webgl" });
          return;
        }
        if (document.visibilityState === "visible") {
          dispatch({ type: "arm" });
          return;
        }
        const onChange = () => {
          if (document.visibilityState !== "visible") return;
          document.removeEventListener("visibilitychange", onChange);
          dispatch({ type: "arm" });
        };
        document.addEventListener("visibilitychange", onChange);
        stopVisible = () => document.removeEventListener("visibilitychange", onChange);
      },
      START_IDLE_TIMEOUT_MS,
    );
    return () => {
      stopIdle();
      stopVisible?.();
    };
  }, [phase]);

  // A scene that has not drawn a frame in time (slow network or device) gives way to the still.
  useEffect(() => {
    if (phase !== "loading") return;
    const timer = window.setTimeout(() => dispatch({ type: "timeout" }), STATIC_FALLBACK_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  // Pause rendering while the tab is hidden or the stage is scrolled out of view.
  useEffect(() => {
    const onChange = () => setTabVisible(document.visibilityState === "visible");
    onChange();
    document.addEventListener("visibilitychange", onChange);
    const el = rootRef.current;
    const observer =
      el && typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver((entries) => {
            const last = entries[entries.length - 1];
            if (last) setOnScreen(last.isIntersecting);
          })
        : null;
    if (el && observer) observer.observe(el);
    return () => {
      document.removeEventListener("visibilitychange", onChange);
      observer?.disconnect();
    };
  }, []);

  const fail = useCallback(() => dispatch({ type: "fail" }), []);
  const firstFrame = useCallback(() => dispatch({ type: "first-frame" }), []);
  const canvasOn = phase === "loading" || phase === "live";

  return (
    <div
      ref={rootRef}
      className={cn("relative", className)}
      style={{ aspectRatio: `${POSTER_VIEWBOX.w} / ${POSTER_VIEWBOX.h}` }}
      data-hero-stage={phase}
    >
      <Poster foreground={posterForeground(phase)} className="absolute inset-0 h-full w-full" />
      <noscript>
        <style>{"[data-hero-poster-foreground]{opacity:1}"}</style>
      </noscript>
      {canvasOn ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ opacity: phase === "live" ? 1 : 0, transition: `opacity ${FADE_MS}ms ease` }}
        >
          <HeroErrorBoundary onError={fail}>
            <Suspense fallback={null}>
              <HeroCanvas
                active={onScreen && tabVisible}
                onFirstFrame={firstFrame}
                onContextLost={fail}
              />
            </Suspense>
          </HeroErrorBoundary>
        </div>
      ) : null}
    </div>
  );
}
