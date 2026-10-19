import type { DesignProblem, Packaging } from "@giftpop/contracts";

import type { BuilderStep } from "./types";
import { BUILDER_STEPS } from "./types";

export interface GuardInput {
  packaging: Packaging | null;
  itemCount: number;
  problems: readonly DesignProblem[];
}

/** Query parameter that marks a share link or template being loaded into the builder. */
export const LOAD_PARAM = "from";

/** True when the URL carries `?from=...`; the review step loads that design first. */
export function hasLoadParam(search: string): boolean {
  return new URLSearchParams(search).has(LOAD_PARAM);
}

/** The earliest step where a design problem can be fixed. */
function stepToFixProblems(problems: readonly DesignProblem[]): BuilderStep {
  const needsFormat = problems.some(
    (problem) =>
      problem.code === "PACKAGING_UNAVAILABLE" ||
      (problem.code === "OUT_OF_STOCK" && problem.itemId === undefined),
  );
  if (needsFormat) return "format";
  const needsItems = problems.some((problem) => problem.code !== "TEXT_TOO_LONG");
  return needsItems ? "items" : "personalise";
}

/**
 * The step a visitor must go back to before `step` can be shown, or null when
 * `step` can be shown. `items` needs a format; `arrange` and `personalise` also
 * need the minimum number of items; `review` needs a design with no problems.
 */
export function firstMissingStep(step: BuilderStep, input: GuardInput): BuilderStep | null {
  const target = BUILDER_STEPS.indexOf(step);
  if (target <= BUILDER_STEPS.indexOf("format")) return null;

  const { packaging, itemCount, problems } = input;
  if (packaging === null) return "format";
  if (target <= BUILDER_STEPS.indexOf("items")) return null;

  if (itemCount < packaging.minItems) return "items";
  if (target <= BUILDER_STEPS.indexOf("personalise")) return null;

  return problems.length === 0 ? null : stepToFixProblems(problems);
}
