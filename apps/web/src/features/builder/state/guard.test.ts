import type { DesignProblem, Packaging } from "@giftpop/contracts";
import { describe, expect, it } from "vitest";

import { firstMissingStep, hasLoadParam } from "./guard";
import type { GuardInput } from "./guard";
import { BOUQUET_ID, makeCatalog } from "./test-fixtures";
import { BUILDER_STEPS } from "./types";

function bouquet(): Packaging {
  const found = makeCatalog().packagings.find((p) => p.packaging.id === BOUQUET_ID);
  if (!found) throw new Error("fixture missing");
  return found.packaging;
}

function problem(code: DesignProblem["code"], itemId?: string): DesignProblem {
  return { code, message: code, ...(itemId ? { itemId } : {}) };
}

const none: GuardInput = { packaging: null, itemCount: 0, problems: [] };
const picking: GuardInput = { packaging: bouquet(), itemCount: 1, problems: [] };
const enough: GuardInput = { packaging: bouquet(), itemCount: 2, problems: [] };

describe("firstMissingStep", () => {
  it("always lets the format step show", () => {
    expect(firstMissingStep("format", none)).toBeNull();
    expect(firstMissingStep("format", enough)).toBeNull();
  });

  it("sends every later step to format when no packaging is chosen", () => {
    for (const step of BUILDER_STEPS.slice(1)) {
      expect(firstMissingStep(step, none)).toBe("format");
    }
  });

  it("lets items show once a packaging is chosen", () => {
    expect(firstMissingStep("items", picking)).toBeNull();
  });

  it("sends arrange and personalise to items until the minimum is picked", () => {
    expect(firstMissingStep("arrange", picking)).toBe("items");
    expect(firstMissingStep("personalise", picking)).toBe("items");
    expect(firstMissingStep("arrange", enough)).toBeNull();
    expect(firstMissingStep("personalise", enough)).toBeNull();
  });

  it("does not look at problems for arrange and personalise", () => {
    const over: GuardInput = { ...enough, problems: [problem("OVER_CAPACITY")] };
    expect(firstMissingStep("arrange", over)).toBeNull();
    expect(firstMissingStep("personalise", over)).toBeNull();
  });

  it("lets review show only with no problems", () => {
    expect(firstMissingStep("review", enough)).toBeNull();
    expect(firstMissingStep("review", picking)).toBe("items");
    expect(firstMissingStep("review", none)).toBe("format");
  });

  it("sends review back to where the problem can be fixed", () => {
    expect(firstMissingStep("review", { ...enough, problems: [problem("OVER_CAPACITY")] })).toBe(
      "items",
    );
    expect(
      firstMissingStep("review", { ...enough, problems: [problem("OUT_OF_STOCK", "b1")] }),
    ).toBe("items");
    expect(firstMissingStep("review", { ...enough, problems: [problem("OUT_OF_STOCK")] })).toBe(
      "format",
    );
    expect(
      firstMissingStep("review", { ...enough, problems: [problem("PACKAGING_UNAVAILABLE")] }),
    ).toBe("format");
    expect(firstMissingStep("review", { ...enough, problems: [problem("TEXT_TOO_LONG")] })).toBe(
      "personalise",
    );
    expect(
      firstMissingStep("review", {
        ...enough,
        problems: [problem("TEXT_TOO_LONG"), problem("TOO_MANY_ITEMS")],
      }),
    ).toBe("items");
  });
});

describe("hasLoadParam", () => {
  it("is true when the URL carries ?from=", () => {
    expect(hasLoadParam("?from=abc123XYZ9")).toBe(true);
    expect(hasLoadParam("?x=1&from=abc123XYZ9")).toBe(true);
  });

  it("is false otherwise", () => {
    expect(hasLoadParam("")).toBe(false);
    expect(hasLoadParam("?x=1")).toBe(false);
    expect(hasLoadParam("?fromage=1")).toBe(false);
  });
});
