import { describe, expect, it } from "vitest";

import { QUESTION_IDS } from "./ids";
import { getQuestion, QUESTIONS } from "./registry";

describe("question registry", () => {
  it("has one definition per id, in flow order", () => {
    expect(QUESTIONS.map((question) => question.id)).toEqual([...QUESTION_IDS]);
  });

  it("names each continue action instead of saying Next", () => {
    for (const question of QUESTIONS) {
      expect(question.continueLabel).not.toMatch(/^next$/i);
      expect(question.title.length).toBeGreaterThan(3);
    }
  });

  it("looks a question up by id", () => {
    expect(getQuestion("items").title).toBe("What goes inside?");
  });
});
