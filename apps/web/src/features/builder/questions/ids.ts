export const QUESTION_IDS = [
  "packaging",
  "colours",
  "items",
  "layout",
  "personalise",
  "review",
] as const;

export type QuestionId = (typeof QUESTION_IDS)[number];

export function isQuestionId(value: unknown): value is QuestionId {
  return typeof value === "string" && (QUESTION_IDS as readonly string[]).includes(value);
}

export function questionIndex(id: QuestionId): number {
  return QUESTION_IDS.indexOf(id);
}

export function nextQuestion(id: QuestionId): QuestionId | undefined {
  return QUESTION_IDS[questionIndex(id) + 1];
}

export function previousQuestion(id: QuestionId): QuestionId | undefined {
  return QUESTION_IDS[questionIndex(id) - 1];
}
