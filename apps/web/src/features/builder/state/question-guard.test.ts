import type { DesignProblem, Packaging } from "@giftpop/contracts";
import { describe, expect, it } from "vitest";

import { QUESTION_IDS } from "../questions/ids";

import { firstMissingQuestion, reachableQuestion } from "./question-guard";
import type { QuestionGuardInput } from "./question-guard";
import { BOUQUET_ID, makeCatalog } from "./test-fixtures";

function bouquet(): Packaging {
  const found = makeCatalog().packagings.find((p) => p.packaging.id === BOUQUET_ID);
  if (!found) throw new Error("fixture missing");
  return found.packaging;
}

function problem(code: DesignProblem["code"], itemId?: string): DesignProblem {
  return { code, message: code, ...(itemId ? { itemId } : {}) };
}

const none: QuestionGuardInput = { packaging: null, itemCount: 0, problems: [] };
const picking: QuestionGuardInput = { packaging: bouquet(), itemCount: 1, problems: [] };
const enough: QuestionGuardInput = { packaging: bouquet(), itemCount: 2, problems: [] };

describe("firstMissingQuestion", () => {
  it("always lets the first question show", () => {
    expect(firstMissingQuestion("packaging", none)).toBeNull();
    expect(firstMissingQuestion("packaging", enough)).toBeNull();
  });

  it("sends every later question back to packaging until one is chosen", () => {
    for (const id of QUESTION_IDS.slice(1)) {
      expect(firstMissingQuestion(id, none)).toBe("packaging");
    }
  });

  it("lets colours and items show once a packaging is chosen", () => {
    expect(firstMissingQuestion("colours", picking)).toBeNull();
    expect(firstMissingQuestion("items", picking)).toBeNull();
  });

  it("needs the minimum number of items for layout and personalise", () => {
    expect(firstMissingQuestion("layout", picking)).toBe("items");
    expect(firstMissingQuestion("personalise", picking)).toBe("items");
    expect(firstMissingQuestion("layout", enough)).toBeNull();
    expect(firstMissingQuestion("personalise", enough)).toBeNull();
  });

  it("lets layout and personalise show with problems, so they can be fixed there", () => {
    const over = { ...enough, problems: [problem("OVER_CAPACITY")] };
    expect(firstMissingQuestion("layout", over)).toBeNull();
    expect(firstMissingQuestion("personalise", over)).toBeNull();
  });

  it("needs a design with no problems for review", () => {
    expect(firstMissingQuestion("review", enough)).toBeNull();
    expect(firstMissingQuestion("review", picking)).toBe("items");
    expect(firstMissingQuestion("review", none)).toBe("packaging");
  });

  it("sends a review with problems to the question that can fix them", () => {
    const withProblems = (...problems: DesignProblem[]) => ({ ...enough, problems });
    expect(firstMissingQuestion("review", withProblems(problem("OVER_CAPACITY")))).toBe("items");
    expect(firstMissingQuestion("review", withProblems(problem("OUT_OF_STOCK", "b1")))).toBe(
      "items",
    );
    expect(firstMissingQuestion("review", withProblems(problem("OUT_OF_STOCK")))).toBe("packaging");
    expect(firstMissingQuestion("review", withProblems(problem("PACKAGING_UNAVAILABLE")))).toBe(
      "packaging",
    );
    expect(firstMissingQuestion("review", withProblems(problem("TEXT_TOO_LONG")))).toBe(
      "personalise",
    );
    expect(
      firstMissingQuestion(
        "review",
        withProblems(problem("TEXT_TOO_LONG"), problem("OVER_CAPACITY")),
      ),
    ).toBe("items");
  });
});

describe("reachableQuestion", () => {
  it("keeps a question that can be shown and replaces one that cannot", () => {
    expect(reachableQuestion("items", picking)).toBe("items");
    expect(reachableQuestion("review", picking)).toBe("items");
    expect(reachableQuestion("colours", none)).toBe("packaging");
  });
});
