"use client";

import type { ReactNode } from "react";
import { Suspense, lazy } from "react";

import type { AnimatedGiftSceneProps } from "../AnimatedGiftScene";

// Loaded on demand so routes that only draw static scenes never download motion (performance
// audit). This lives in its own client module: a lazy import inside a Server Component makes
// Next preload the chunk on every route that renders `GiftScene`.
const AnimatedGiftScene = lazy(() =>
  import("../AnimatedGiftScene").then((module) => ({ default: module.AnimatedGiftScene })),
);

/** The animated scene, with `fallback` (the static scene: same SVG, same size) until it loads. */
export function MotionScene({
  fallback,
  ...props
}: AnimatedGiftSceneProps & { fallback: ReactNode }) {
  return (
    <Suspense fallback={fallback}>
      <AnimatedGiftScene {...props} />
    </Suspense>
  );
}
