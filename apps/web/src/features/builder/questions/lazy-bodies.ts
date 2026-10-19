"use client";

import type { ComponentType } from "react";

/**
 * The dynamic imports of the question bodies that load after the first question. Each becomes its
 * own chunk. They live in a "use client" module: a lazy import reached from a Server Component
 * makes Next preload it, which would undo the split.
 */
export const LAZY_BODIES = {
  colours: (): Promise<ComponentType> => import("./colours").then((m) => m.ColoursBody),
  items: (): Promise<ComponentType> => import("./items").then((m) => m.ItemsBody),
  layout: (): Promise<ComponentType> => import("./layout").then((m) => m.LayoutBody),
  personalise: (): Promise<ComponentType> => import("./personalise").then((m) => m.PersonaliseBody),
  review: (): Promise<ComponentType> => import("./review").then((m) => m.ReviewBody),
} as const;
