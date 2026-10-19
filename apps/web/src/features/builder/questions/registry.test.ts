import { describe, expect, it } from "vitest";

import { QUESTION_IDS } from "./ids";
import { getQuestion, LAZY_QUESTION_IDS, QUESTIONS } from "./registry";

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

describe("question bodies and actions", () => {
  it("ships the first question's body with the shell and loads the rest on demand", () => {
    expect("eager" in getQuestion("packaging").body).toBe(true);
    expect(LAZY_QUESTION_IDS).toEqual(QUESTION_IDS.filter((id) => id !== "packaging"));
  });

  it("gives review its own footer action and every other question the continue button", () => {
    for (const question of QUESTIONS) {
      expect(question.Action !== undefined).toBe(question.id === "review");
    }
    expect(getQuestion("review").continueLabel).toBe("Continue to checkout");
  });
});
