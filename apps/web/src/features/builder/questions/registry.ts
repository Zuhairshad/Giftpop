import type { ComponentType } from "react";

import { ColoursBody, useColoursCanContinue } from "./colours";
import { QUESTION_IDS } from "./ids";
import type { QuestionId } from "./ids";
import { ItemsBody, useItemsCanContinue } from "./items";
import { LayoutBody, useLayoutCanContinue } from "./layout";
import { PackagingBody, usePackagingCanContinue } from "./packaging";
import { PersonaliseBody, usePersonaliseCanContinue } from "./personalise";
import { ReviewBody, useReviewCanContinue } from "./review";

export interface QuestionDef {
  id: QuestionId;
  /** The plain-language question, shown as the heading of the question surface. */
  title: string;
  /** Names the next move, never just "Next". */
  continueLabel: string;
  /** True when the body draws its own actions (review: save and share, go to checkout), so the shell adds none. */
  ownsActions: boolean;
  /** The answer controls. Rendered inside the shell's surface; reads and writes the builder store. */
  Body: ComponentType;
  /** A hook the shell calls to enable the continue button for this question. */
  useCanContinue: () => boolean;
}

/** The one place the shell and the question contents meet. Order here is the order of the flow. */
const DEFS: readonly QuestionDef[] = [
  {
    id: "packaging",
    title: "What should your gift come in?",
    continueLabel: "Continue to colours",
    ownsActions: false,
    Body: PackagingBody,
    useCanContinue: usePackagingCanContinue,
  },
  {
    id: "colours",
    title: "Pick your colours",
    continueLabel: "Continue to items",
    ownsActions: false,
    Body: ColoursBody,
    useCanContinue: useColoursCanContinue,
  },
  {
    id: "items",
    title: "What goes inside?",
    continueLabel: "Continue to layout",
    ownsActions: false,
    Body: ItemsBody,
    useCanContinue: useItemsCanContinue,
  },
  {
    id: "layout",
    title: "Happy with the layout?",
    continueLabel: "Continue to personalise",
    ownsActions: false,
    Body: LayoutBody,
    useCanContinue: useLayoutCanContinue,
  },
  {
    id: "personalise",
    title: "Who's it for?",
    continueLabel: "Continue to review",
    ownsActions: false,
    Body: PersonaliseBody,
    useCanContinue: usePersonaliseCanContinue,
  },
  {
    id: "review",
    title: "Your gift is ready",
    continueLabel: "Continue to checkout",
    ownsActions: true,
    Body: ReviewBody,
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
