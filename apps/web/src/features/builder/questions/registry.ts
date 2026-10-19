import type { ComponentType } from "react";

import { QUESTION_IDS } from "./ids";
import type { QuestionId } from "./ids";
import { LAZY_BODIES } from "./lazy-bodies";
import { PackagingBody } from "./packaging";
import { ReviewCheckoutAction } from "./review/checkout-action";
import {
  useColoursCanContinue,
  useItemsCanContinue,
  useLayoutCanContinue,
  usePackagingCanContinue,
  usePersonaliseCanContinue,
  useReviewCanContinue,
} from "./use-can-continue";

/** Where a body comes from: bundled with the shell, or a chunk loaded when needed (`body-loader`). */
export type QuestionBody = { eager: ComponentType } | { load: () => Promise<ComponentType> };

export interface QuestionDef {
  id: QuestionId;
  /** The plain-language question, shown as the heading of the question surface. */
  title: string;
  /** Names the next move, never just "Next". */
  continueLabel: string;
  /**
   * The question's own primary action, drawn in the footer in place of the continue button
   * (review: the link to checkout). It takes the footer's sizing classes.
   */
  Action?: ComponentType<{ className?: string }>;
  /** The answer controls. Rendered inside the shell's surface; reads and writes the builder store. */
  body: QuestionBody;
  /** A hook the shell calls to enable the primary action for this question. */
  useCanContinue: () => boolean;
}

/** The one place the shell and the question contents meet. Order here is the order of the flow. */
const DEFS: readonly QuestionDef[] = [
  {
    id: "packaging",
    title: "What should your gift come in?",
    continueLabel: "Continue to colours",
    // The first question most visitors see, so it ships with the shell.
    body: { eager: PackagingBody },
    useCanContinue: usePackagingCanContinue,
  },
  {
    id: "colours",
    title: "Pick your colours",
    continueLabel: "Continue to items",
    body: { load: LAZY_BODIES.colours },
    useCanContinue: useColoursCanContinue,
  },
  {
    id: "items",
    title: "What goes inside?",
    continueLabel: "Continue to layout",
    body: { load: LAZY_BODIES.items },
    useCanContinue: useItemsCanContinue,
  },
  {
    id: "layout",
    title: "Happy with the layout?",
    continueLabel: "Continue to personalise",
    body: { load: LAZY_BODIES.layout },
    useCanContinue: useLayoutCanContinue,
  },
  {
    id: "personalise",
    title: "Who's it for?",
    continueLabel: "Continue to review",
    body: { load: LAZY_BODIES.personalise },
    useCanContinue: usePersonaliseCanContinue,
  },
  {
    id: "review",
    title: "Your gift is ready",
    continueLabel: "Continue to checkout",
    Action: ReviewCheckoutAction,
    body: { load: LAZY_BODIES.review },
    useCanContinue: useReviewCanContinue,
  },
];

export const QUESTIONS: readonly QuestionDef[] = QUESTION_IDS.map((id) => {
  const def = DEFS.find((candidate) => candidate.id === id);
  if (!def) throw new Error(`No question registered for "${id}"`);
  return def;
});

export function getQuestion(id: QuestionId): QuestionDef {
  const def = QUESTIONS.find((candidate) => candidate.id === id);
  if (!def) throw new Error(`No question registered for "${id}"`);
  return def;
}

/** The questions whose bodies load on demand, in flow order. */
export const LAZY_QUESTION_IDS: readonly QuestionId[] = QUESTIONS.filter(
  (question) => "load" in question.body,
).map((question) => question.id);
