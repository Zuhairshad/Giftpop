import { describe, expect, it } from "vitest";

import { buttonClass } from "./button";

const classes = (value: string) => value.split(/\s+/);

describe("buttonClass", () => {
  it("defaults to a 48px primary button", () => {
    const result = classes(buttonClass());
    expect(result).toContain("bg-primary");
    expect(result).toContain("shadow-cta");
    expect(result).toContain("min-h-12");
    expect(result).toContain("rounded-md");
  });

  it("maps sizes to the 44, 48 and 56px touch targets", () => {
    expect(classes(buttonClass({ size: "sm" }))).toContain("min-h-11");
    expect(classes(buttonClass({ size: "md" }))).toContain("min-h-12");
    expect(classes(buttonClass({ size: "lg" }))).toContain("min-h-14");
  });

  it("never uses a pill radius, in any variant", () => {
    for (const variant of ["primary", "tint", "ghost"] as const) {
      expect(buttonClass({ variant })).not.toContain("rounded-full");
    }
  });

  it("gives the tint variant the tint fill and pressed-pink label", () => {
    const result = classes(buttonClass({ variant: "tint" }));
    expect(result).toContain("bg-primary-tint");
    expect(result).toContain("text-primary-pressed");
    expect(result).not.toContain("bg-primary");
  });

  it("gives the ghost variant a transparent fill and no shadow", () => {
    const result = classes(buttonClass({ variant: "ghost" }));
    expect(result).toContain("bg-transparent");
    expect(result).not.toContain("shadow-cta");
  });

  it("adds full width for block buttons only", () => {
    expect(classes(buttonClass({ block: true }))).toContain("w-full");
    expect(classes(buttonClass())).not.toContain("w-full");
  });

  it("gives a disabled primary a neutral fill and label, no lift and a not-allowed cursor", () => {
    const result = classes(buttonClass());
    for (const state of ["disabled", "aria-disabled"]) {
      expect(result).toContain(`${state}:bg-warm-2`);
      expect(result).toContain(`${state}:text-ink-2`);
      expect(result).toContain(`${state}:shadow-none`);
      expect(result).toContain(`${state}:cursor-not-allowed`);
      // Not a washed-out pink: the primary is never faded.
      expect(result).not.toContain(`${state}:opacity-50`);
    }
  });

  it("keeps pointer events on disabled buttons so the cursor shows", () => {
    expect(buttonClass()).not.toContain("pointer-events-none");
  });

  it("fades the tint and ghost variants when disabled", () => {
    for (const variant of ["tint", "ghost"] as const) {
      const result = classes(buttonClass({ variant }));
      expect(result).toContain("disabled:opacity-50");
      expect(result).toContain("aria-disabled:opacity-50");
      expect(result).toContain("disabled:cursor-not-allowed");
    }
  });

  it("appends a caller class last", () => {
    expect(buttonClass({ className: "mt-4" }).endsWith("mt-4")).toBe(true);
  });
});
