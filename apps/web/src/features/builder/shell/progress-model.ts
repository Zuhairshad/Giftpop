import { QUESTION_IDS, questionIndex } from "../questions/ids";
import type { QuestionId } from "../questions/ids";

export interface QuestionProgress {
  /** 1-based position of the current question. */
  position: number;
  total: number;
  /** "Question 3 of 6", shown and used as the progress bar's text value. */
  label: string;
  /** One flag per question: true up to and including the current one. */
  segments: boolean[];
}

export function questionProgress(current: QuestionId): QuestionProgress {
  const index = questionIndex(current);
  const total = QUESTION_IDS.length;
  return {
    position: index + 1,
    total,
    label: `Question ${index + 1} of ${total}`,
    segments: QUESTION_IDS.map((_, position) => position <= index),
  };
}
