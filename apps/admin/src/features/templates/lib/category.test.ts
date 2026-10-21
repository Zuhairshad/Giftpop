import type { TemplateCategory } from "@giftpop/contracts";
import { describe, expect, it } from "vitest";

import { categoryOptions, resolveNewCategory } from "./category";

const birthday: TemplateCategory = { slug: "birthday", name: "Birthday" };
const getWell: TemplateCategory = { slug: "get-well", name: "Get well" };

describe("categoryOptions", () => {
  it("lists each used category once, sorted by name", () => {
    const options = categoryOptions([
      { category: getWell },
      { category: null },
      { category: birthday },
      { category: { slug: "birthday", name: "BIRTHDAY" } },
    ]);
    expect(options).toEqual([birthday, getWell]);
  });
  it("includes the category of the template being edited", () => {
    expect(categoryOptions([], birthday)).toEqual([birthday]);
  });
  it("is empty when nothing has a category", () => {
    expect(categoryOptions([{ category: null }])).toEqual([]);
  });
});

describe("resolveNewCategory", () => {
  it("derives the slug from the typed name", () => {
    expect(resolveNewCategory("  Get   well ", [])).toEqual({
      state: "ready",
      category: { slug: "get-well", name: "Get well" },
      reused: false,
    });
  });
  it("reuses an existing category with the same slug", () => {
    expect(resolveNewCategory("get well!", [getWell])).toEqual({
      state: "ready",
      category: getWell,
      reused: true,
    });
  });
  it("treats blank as empty", () => {
    expect(resolveNewCategory("   ", [])).toEqual({ state: "empty" });
  });
  it("rejects names with nothing a slug can use", () => {
    expect(resolveNewCategory("!!!", []).state).toBe("invalid");
  });
  it("rejects names over 40 characters", () => {
    expect(resolveNewCategory("a".repeat(41), []).state).toBe("invalid");
  });
});
