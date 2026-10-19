"use client";

import type { ReactElement } from "react";

import type { QuestionId } from "../questions/ids";
import { questionIndex } from "../questions/ids";
import { getQuestion } from "../questions/registry";
import { useBuilder } from "../state";

import { Button } from "@/components/ui";

/**
 * Back (ghost, not on the first question) and the one primary button, which names the next move.
 * Mount one per question (`key`): the registry's `useCanContinue` is a hook of that question.
 */
export function QuestionFooter({ question }: { question: QuestionId }): ReactElement {
  const { previousQuestion, nextQuestion } = useBuilder();
  const { continueLabel, ownsActions, useCanContinue } = getQuestion(question);
  const canContinue = useCanContinue();
  const isFirst = questionIndex(question) === 0;

  return (
    <div className="border-border flex shrink-0 items-center justify-between gap-2.5 border-t px-4 pt-2.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] min-[900px]:px-6 min-[900px]:pt-3.5 min-[900px]:pb-5">
      {isFirst ? (
        <span />
      ) : (
        <Button variant="ghost" size="sm" onClick={previousQuestion} className="px-3">
          <span aria-hidden="true">&larr;</span> Back
        </Button>
      )}
      {ownsActions ? null : (
        <Button
          size="md"
          disabled={!canContinue}
          onClick={nextQuestion}
          className="max-w-[260px] min-w-0 flex-1 min-[900px]:max-w-none min-[900px]:flex-initial min-[900px]:px-8"
        >
          {continueLabel}
        </Button>
      )}
    </div>
  );
}
