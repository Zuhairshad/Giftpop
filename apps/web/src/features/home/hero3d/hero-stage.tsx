"use client";

import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";


import { hasWebGL, REDUCED_MOTION_QUERY, whenIdle } from "./capabilities";
import { POSTER_VIEWBOX } from "./constants";
import { HeroErrorBoundary } from "./hero-error-boundary";
import { Poster } from "./poster";

import { cn } from "@/lib/cn";

// The Three.js scene is a separate chunk. It is imported here, in a client module, and only
// rendered after hydration and idle, so no route's first-load JavaScript contains it.
const HeroCanvas = lazy(() => import("./hero-canvas").then((m) => ({ default: m.HeroCanvas })));

const FADE_MS = 400;

function LiveCanvas({
  active,
  onLive,
  onFail,
}: {
  active: boolean;
  onLive: (live: boolean) => void;
  onFail: () => void;
}) {
  useEffect(() => () => onLive(false), [onLive]);
  return (
    <HeroErrorBoundary onError={onFail}>
      <Suspense fallback={null}>
        <HeroCanvas active={active} onFirstFrame={() => onLive(true)} onContextLost={onFail} />
      </Suspense>
    </HeroErrorBoundary>
  );
}

/**
 * The home hero. Renders the SVG poster straight away (it is the LCP and the final frame of the
 * animation). After hydration and idle, if motion is allowed, WebGL works and the page is
 * visible, it loads the 3D scene and cross-fades it over the poster. Reduced motion, no WebGL
 * or any error leaves the poster alone. The page's own light pool shows through the canvas.
 */
export function HeroStage({ className }: { className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [reduced, setReduced] = useState<boolean | null>(null);
  const [armed, setArmed] = useState(false);
  const [failed, setFailed] = useState(false);
  const [live, setLive] = useState(false);
  const [onScreen, setOnScreen] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);

  useEffect(() => {
    const query = window.matchMedia(REDUCED_MOTION_QUERY);
    const sync = () => setReduced(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  // Once motion is allowed: wait for idle, test WebGL, wait for a visible tab, then arm the canvas.
  useEffect(() => {
    if (reduced !== false || armed || failed) return;
    let stopVisible: (() => void) | undefined;
    const stopIdle = whenIdle(window, () => {
      if (!hasWebGL(document)) {
        setFailed(true);
        return;
      }
      if (document.visibilityState === "visible") {
        setArmed(true);
        return;
      }
      const onChange = () => {
        if (document.visibilityState !== "visible") return;
        document.removeEventListener("visibilitychange", onChange);
        setArmed(true);
      };
      document.addEventListener("visibilitychange", onChange);
      stopVisible = () => document.removeEventListener("visibilitychange", onChange);
    });
    return () => {
      stopIdle();
      stopVisible?.();
    };
  }, [reduced, armed, failed]);

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

  const fail = useCallback(() => setFailed(true), []);
  const canvasOn = armed && reduced === false && !failed;
  const showCanvas = canvasOn && live;

  return (
    <div
      ref={rootRef}
      className={cn("relative", className)}
      style={{ aspectRatio: `${POSTER_VIEWBOX.w} / ${POSTER_VIEWBOX.h}` }}
      data-hero-stage={showCanvas ? "live" : "poster"}
    >
      <Poster foreground={!showCanvas} className="absolute inset-0 h-full w-full" />
      {canvasOn ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ opacity: live ? 1 : 0, transition: `opacity ${FADE_MS}ms ease` }}
        >
          <LiveCanvas active={onScreen && tabVisible} onLive={setLive} onFail={fail} />
        </div>
      ) : null}
    </div>
  );
}
