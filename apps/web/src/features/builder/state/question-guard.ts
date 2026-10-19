import type { DesignProblem, Packaging } from "@giftpop/contracts";

import { questionIndex } from "../questions/ids";
import type { QuestionId } from "../questions/ids";

export interface QuestionGuardInput {
  packaging: Packaging | null;
  itemCount: number;
  problems: readonly DesignProblem[];
}

/** The earliest question where a design problem can be fixed. */
function questionToFixProblems(problems: readonly DesignProblem[]): QuestionId {
  const needsPackaging = problems.some(
    (problem) =>
      problem.code === "PACKAGING_UNAVAILABLE" ||
      (problem.code === "OUT_OF_STOCK" && problem.itemId === undefined),
  );
  if (needsPackaging) return "packaging";
  const needsItems = problems.some((problem) => problem.code !== "TEXT_TOO_LONG");
  return needsItems ? "items" : "personalise";
}

/**
 * The question a visitor must go back to before `question` can be shown, or null when `question`
 * can be shown. Colours and items need a packaging; layout and personalise also need the minimum
 * number of items; review needs a design with no problems.
 */
export function firstMissingQuestion(
  question: QuestionId,
  input: QuestionGuardInput,
): QuestionId | null {
  const target = questionIndex(question);
  if (target <= questionIndex("packaging")) return null;

  const { packaging, itemCount, problems } = input;
  if (packaging === null) return "packaging";
  if (target <= questionIndex("items")) return null;

  if (itemCount < packaging.minItems) return "items";
  if (target <= questionIndex("personalise")) return null;

  return problems.length === 0 ? null : questionToFixProblems(problems);
}

/** `question` itself when it can be shown, else the question the visitor must go back to. */
export function reachableQuestion(question: QuestionId, input: QuestionGuardInput): QuestionId {
  return firstMissingQuestion(question, input) ?? question;
}
