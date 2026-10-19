import { describe, expect, it } from "vitest";

import { QUESTION_IDS } from "../questions/ids";

import { questionProgress } from "./progress-model";

describe("questionProgress", () => {
  it("counts from one and fills every segment up to the current question", () => {
    expect(questionProgress("items")).toEqual({
      position: 3,
      total: 6,
      label: "Question 3 of 6",
      segments: [true, true, true, false, false, false],
    });
  });

  it("has one segment on the first question and all on the last", () => {
    expect(questionProgress("packaging").segments).toEqual([
      true,
      false,
      false,
      false,
      false,
      false,
    ]);
    expect(questionProgress("review")).toMatchObject({ position: 6, label: "Question 6 of 6" });
    expect(questionProgress("review").segments.every(Boolean)).toBe(true);
  });

  it("has one segment per question", () => {
    for (const id of QUESTION_IDS) {
      expect(questionProgress(id).segments).toHaveLength(QUESTION_IDS.length);
    }
  });
});
