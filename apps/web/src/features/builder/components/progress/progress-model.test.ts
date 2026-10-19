import { describe, expect, it } from "vitest";

import { BUILDER_STEPS } from "../../state/types";

import {
  backTarget,
  previousStep,
  progressEntries,
  progressSummary,
  statusHint,
} from "./progress-model";

describe("progressEntries", () => {
  it("lists the five steps in order with plain labels", () => {
    const labels = progressEntries("format").map((entry) => entry.label);
    expect(labels).toEqual(["Format", "Items", "Arrange", "Personalise", "Review"]);
    expect(progressEntries("format").map((entry) => entry.step)).toEqual([...BUILDER_STEPS]);
  });

  it("marks earlier steps done, the current one current and later ones upcoming", () => {
    expect(progressEntries("arrange").map((entry) => entry.status)).toEqual([
      "done",
      "done",
      "current",
      "upcoming",
      "upcoming",
    ]);
  });

  it("has exactly one current step for every step", () => {
    for (const step of BUILDER_STEPS) {
      expect(progressEntries(step).filter((entry) => entry.status === "current")).toHaveLength(1);
    }
  });

  it("numbers steps from 1", () => {
    expect(progressEntries("review").map((entry) => entry.position)).toEqual([1, 2, 3, 4, 5]);
  });
});

describe("previousStep", () => {
  it("is null on the first step", () => {
    expect(previousStep("format")).toBeNull();
  });

  it("is the step before otherwise", () => {
    expect(previousStep("items")).toBe("format");
    expect(previousStep("review")).toBe("personalise");
  });
});

describe("backTarget", () => {
  it("leads to the country choice from the first step", () => {
    expect(backTarget("format", "PK")).toEqual({
      href: "/#choose-country",
      label: "Change country",
    });
  });

  it("leads to the previous step with a lower-case country in the url", () => {
    expect(backTarget("items", "PK")).toEqual({
      href: "/pk/build/format",
      label: "Back to Format",
    });
    expect(backTarget("personalise", "AE").href).toBe("/ae/build/arrange");
  });
});

describe("progressSummary and statusHint", () => {
  it("says which step of five the visitor is on", () => {
    expect(progressSummary("items")).toBe("Step 2 of 5: Items");
  });

  it("describes each status in words", () => {
    expect(statusHint("done")).toBe("completed");
    expect(statusHint("current")).toBe("current step");
    expect(statusHint("upcoming")).toBe("not reached yet");
  });
});
