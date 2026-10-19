import { questionIndex } from "../questions/ids";
import type { QuestionId } from "../questions/ids";

/** 1 when the new question comes after the old one (it enters from the right), -1 for Back. */
export type Direction = 1 | -1;

/** Forward when `to` is the same as or after `from`, Back when it is before. */
export function transitionDirection(from: QuestionId, to: QuestionId): Direction {
  return questionIndex(to) < questionIndex(from) ? -1 : 1;
}

export interface QuestionTracking {
  question: QuestionId;
  hydrated: boolean;
  direction: Direction;
  /**
   * True on the render where the visitor moved to another question. False on first paint and when the
   * question changed only because saved state was read back: that is a restore, not a move, so it
   * neither animates nor takes focus.
   */
  moved: boolean;
}

export function startTracking(question: QuestionId, hydrated: boolean): QuestionTracking {
  return { question, hydrated, direction: 1, moved: false };
}

/** What changed since the last render: which way the visitor is going, and whether it is a real move. */
export function trackQuestion(
  previous: QuestionTracking,
  question: QuestionId,
  hydrated: boolean,
): QuestionTracking {
  const changed = previous.question !== question;
  return {
    question,
    hydrated,
    direction: changed ? transitionDirection(previous.question, question) : previous.direction,
    moved: changed && previous.hydrated && hydrated,
  };
}

/** Horizontal travel of a question entering (`entering`) or leaving; none under reduced motion. */
export function layerOffset(
  direction: Direction,
  phase: "enter" | "exit",
  distance: number,
  reduced: boolean,
): number {
  if (reduced) return 0;
  return phase === "enter" ? direction * distance : -direction * distance;
}
