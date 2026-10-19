import { describe, expect, it } from "vitest";

import { PartnerUpdateFormSchema, toUpdateBody } from "./update-form";

describe("toUpdateBody", () => {
  it("sends nothing when nothing changed", () => {
    expect(toUpdateBody({ status: "new", note: "   " }, "new")).toBeNull();
  });
  it("sends only the changed status", () => {
    expect(toUpdateBody({ status: "in_talks", note: "" }, "new")).toEqual({ status: "in_talks" });
  });
  it("sends only a note when the status is the same, trimmed", () => {
    expect(toUpdateBody({ status: "new", note: "  Called them " }, "new")).toEqual({
      note: "Called them",
    });
  });
  it("sends both", () => {
    expect(toUpdateBody({ status: "declined", note: "No fit" }, "new")).toEqual({
      status: "declined",
      note: "No fit",
    });
  });
});

describe("PartnerUpdateFormSchema", () => {
  it("rejects a long note and an unknown status", () => {
    expect(
      PartnerUpdateFormSchema.safeParse({ status: "new", note: "x".repeat(2001) }).success,
    ).toBe(false);
    expect(PartnerUpdateFormSchema.safeParse({ status: "done", note: "" }).success).toBe(false);
    expect(PartnerUpdateFormSchema.safeParse({ status: "new", note: "" }).success).toBe(true);
  });
});
