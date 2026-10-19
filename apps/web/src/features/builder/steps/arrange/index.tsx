"use client";

import { ArrangeView } from "./arrange-view";

import { useBuilder, useStepGuard } from "@/features/builder/state";


/** Step 4: shuffle, reorder, and pick wrapper and ribbon colours while the gift stays in view. */
export function ArrangeStep() {
  useStepGuard("arrange");
  const builder = useBuilder();
  return <ArrangeView builder={builder} />;
}
