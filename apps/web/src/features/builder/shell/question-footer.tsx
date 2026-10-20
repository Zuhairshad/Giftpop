"use client";

import { useId } from "react";
import type { ReactElement } from "react";

import type { QuestionId } from "../questions/ids";
import { questionIndex } from "../questions/ids";
import { getQuestion } from "../questions/registry";
import { useBuilder } from "../state";

import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";

// Phones: shares the row with Back, at most 260px wide.
const PRIMARY =
  "max-w-[260px] min-w-0 flex-1 min-[900px]:max-w-none min-[900px]:flex-initial min-[900px]:px-8";

const REASON = "text-muted text-[13px] leading-snug font-medium wrap-anywhere";

/**
 * Back (ghost, not on the first question) and the one primary action, which names the next move
 * (the question's own `Action` when it has one). While the action is off, a one-line reason
 * ("Pick a packaging first") sits beside it (first question, where Back's place is free) or just
 * above the row, and the action points at it with `aria-describedby`.
 * Mount one per question (`key`): the registry's `useCanContinue` is a hook of that question.
 */
export function QuestionFooter({ question }: { question: QuestionId }): ReactElement {
  const { previousQuestion, nextQuestion } = useBuilder();
  const { continueLabel, Action, useCanContinue } = getQuestion(question);
  const check = useCanContinue();
  const isFirst = questionIndex(question) === 0;
  const reasonId = useId();
  const reason = check.ready ? null : check.reason;
  const describedBy = reason ? reasonId : undefined;

  const reasonLine = reason ? (
    <p
      id={reasonId}
      className={cn(
        REASON,
        isFirst ? "line-clamp-2 min-w-0 flex-1" : "pb-1.5 text-end min-[900px]:pb-2",
      )}
    >
      {reason}
    </p>
  ) : null;

  return (
    <div className="border-border shrink-0 border-t px-4 pt-2.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] min-[900px]:px-6 min-[900px]:pt-3.5 min-[900px]:pb-5">
      {isFirst ? null : reasonLine}
      <div className="flex items-center justify-between gap-2.5">
        {isFirst ? (
          (reasonLine ?? <span />)
        ) : (
          <Button variant="ghost" size="sm" onClick={previousQuestion} className="shrink-0 px-3">
            <span aria-hidden="true">&larr;</span> Back
          </Button>
        )}
        {Action ? (
          <Action className={PRIMARY} {...(describedBy ? { reasonId: describedBy } : {})} />
        ) : (
          <Button
            size="md"
            disabled={!check.ready}
            aria-describedby={describedBy}
            onClick={nextQuestion}
            className={PRIMARY}
          >
            {continueLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
