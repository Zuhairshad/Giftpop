import type { CountryCode } from "@giftpop/contracts";

import { stepHref } from "../../state/steps";
import { BUILDER_STEPS } from "../../state/types";
import type { BuilderStep } from "../../state/types";

export const STEP_LABELS = {
  format: "Format",
  items: "Items",
  arrange: "Arrange",
  personalise: "Personalise",
  review: "Review",
} as const satisfies Record<BuilderStep, string>;

export type ProgressStatus = "done" | "current" | "upcoming";

export interface ProgressEntry {
  step: BuilderStep;
  label: string;
  /** 1-based position shown in the step circle. */
  position: number;
  status: ProgressStatus;
}

export interface BackTarget {
  href: string;
  label: string;
}

/** The five steps in order, each marked done, current or upcoming. */
export function progressEntries(current: BuilderStep): ProgressEntry[] {
  const currentIndex = BUILDER_STEPS.indexOf(current);
  return BUILDER_STEPS.map((step, index) => ({
    step,
    label: STEP_LABELS[step],
    position: index + 1,
    status: index < currentIndex ? "done" : index === currentIndex ? "current" : "upcoming",
  }));
}

/** The step before this one, or null on the first step. */
export function previousStep(current: BuilderStep): BuilderStep | null {
  const index = BUILDER_STEPS.indexOf(current);
  return index > 0 ? (BUILDER_STEPS[index - 1] ?? null) : null;
}

/** Short text for small screens, for example "Step 2 of 5: Items". */
export function progressSummary(current: BuilderStep): string {
  const position = BUILDER_STEPS.indexOf(current) + 1;
  return `Step ${position} of ${BUILDER_STEPS.length}: ${STEP_LABELS[current]}`;
}

/** Where the back link goes. From the first step it leads to the country choice. */
export function backTarget(current: BuilderStep, country: CountryCode): BackTarget {
  const previous = previousStep(current);
  if (!previous) return { href: "/#choose-country", label: "Change country" };
  return { href: stepHref(country, previous), label: `Back to ${STEP_LABELS[previous]}` };
}

/** Accessible name suffix for a step, so its state is not only shown by colour. */
export function statusHint(status: ProgressStatus): string {
  if (status === "done") return "completed";
  if (status === "current") return "current step";
  return "not reached yet";
}
