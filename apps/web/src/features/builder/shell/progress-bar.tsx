import type { ReactElement } from "react";

import type { QuestionId } from "../questions/ids";

import { questionProgress } from "./progress-model";

/** Six segments, one per question, filled up to the current one. The text label sits in the question header. */
export function ProgressBar({ question }: { question: QuestionId }): ReactElement {
  const progress = questionProgress(question);
  return (
    <div
      role="progressbar"
      aria-label="Gift builder progress"
      aria-valuemin={1}
      aria-valuemax={progress.total}
      aria-valuenow={progress.position}
      aria-valuetext={progress.label}
      className="flex gap-1.5"
    >
      {progress.segments.map((filled, index) => (
        <span
          key={index}
          aria-hidden="true"
          className={`h-1 flex-1 rounded-xs transition-colors duration-200 ${
            filled ? "bg-pink" : "bg-warm-deep"
          }`}
        />
      ))}
    </div>
  );
}
