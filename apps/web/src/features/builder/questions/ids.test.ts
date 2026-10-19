import { describe, expect, it } from "vitest";

import { isQuestionId, nextQuestion, previousQuestion, QUESTION_IDS, questionIndex } from "./ids";

describe("question ids", () => {
  it("run packaging, colours, items, layout, personalise, review", () => {
    expect([...QUESTION_IDS]).toEqual([
      "packaging",
      "colours",
      "items",
      "layout",
      "personalise",
      "review",
    ]);
  });

  it("step forward and back, and stop at both ends", () => {
    expect(nextQuestion("packaging")).toBe("colours");
    expect(nextQuestion("personalise")).toBe("review");
    expect(nextQuestion("review")).toBeUndefined();
    expect(previousQuestion("review")).toBe("personalise");
    expect(previousQuestion("packaging")).toBeUndefined();
    expect(questionIndex("items")).toBe(2);
  });

  it("recognise only real ids", () => {
    expect(isQuestionId("items")).toBe(true);
    expect(isQuestionId("format")).toBe(false);
    expect(isQuestionId(undefined)).toBe(false);
  });
});
