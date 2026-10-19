"use client";

import { PersonaliseView } from "./personalise-view";

import { useBuilder, useStepGuard } from "@/features/builder/state";


/** Step 5: card message, recipient name and names on personalizable items. All optional. */
export function PersonaliseStep() {
  useStepGuard("personalise");
  const builder = useBuilder();
  return <PersonaliseView builder={builder} />;
}
