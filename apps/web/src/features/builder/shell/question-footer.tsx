"use client";

import type { ReactElement } from "react";

import type { QuestionId } from "../questions/ids";
import { questionIndex } from "../questions/ids";
import { getQuestion } from "../questions/registry";
import { useBuilder } from "../state";

import { Button } from "@/components/ui";

// Phones: shares the row with Back, at most 260px wide.
const PRIMARY =
  "max-w-[260px] min-w-0 flex-1 min-[900px]:max-w-none min-[900px]:flex-initial min-[900px]:px-8";

/**
 * Back (ghost, not on the first question) and the one primary action, which names the next move
 * (the question's own `Action` when it has one).
 * Mount one per question (`key`): the registry's `useCanContinue` is a hook of that question.
 */
export function QuestionFooter({ question }: { question: QuestionId }): ReactElement {
  const { previousQuestion, nextQuestion } = useBuilder();
  const { continueLabel, Action, useCanContinue } = getQuestion(question);
  const canContinue = useCanContinue();
  const isFirst = questionIndex(question) === 0;

  return (
    <div className="border-border flex shrink-0 items-center justify-between gap-2.5 border-t px-4 pt-2.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] min-[900px]:px-6 min-[900px]:pt-3.5 min-[900px]:pb-5">
      {isFirst ? (
        <span />
      ) : (
        <Button variant="ghost" size="sm" onClick={previousQuestion} className="shrink-0 px-3">
          <span aria-hidden="true">&larr;</span> Back
        </Button>
      )}
      {Action ? (
        <Action className={PRIMARY} />
      ) : (
        <Button size="md" disabled={!canContinue} onClick={nextQuestion} className={PRIMARY}>
          {continueLabel}
        </Button>
      )}
    </div>
  );
}
