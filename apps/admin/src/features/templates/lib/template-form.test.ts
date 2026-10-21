import type { FeaturedTemplate } from "@giftpop/contracts";
import { describe, expect, it } from "vitest";

import {
  CreateTemplateFormSchema,
  TemplateFormSchema,
  emptyTemplateValues,
  templateToValues,
  toActiveRequest,
  toCategoryRequest,
  toCreateRequest,
  toSortOrderRequest,
  toUpdateRequest,
} from "./template-form";

const valid = {
  ...emptyTemplateValues(),
  shareLink: "https://shop.test/g/abc123XYZ_/",
  title: "  Spring thank-you ",
  description: "Soft and floral",
  countries: ["PK", "AE"],
  sortOrder: 2,
};

describe("template form mapping", () => {
  it("builds a create request with the share id extracted", () => {
    expect(toCreateRequest(valid)).toEqual({
      title: "Spring thank-you",
      description: "Soft and floral",
      shareId: "abc123XYZ_",
      countries: ["PK", "AE"],
      sortOrder: 2,
      category: null,
      featured: false,
    });
  });
  it("throws when the link is unreadable", () => {
    expect(() => toCreateRequest({ ...valid, shareLink: "nope" })).toThrow();
  });
  it("builds update bodies without a share id", () => {
    expect(toUpdateRequest({ ...valid, active: false })).toEqual({
      title: "Spring thank-you",
      description: "Soft and floral",
      countries: ["PK", "AE"],
      sortOrder: 2,
      active: false,
      category: null,
      featured: false,
    });
  });
  it("one-field requests restate the saved description and sort order and add nothing else", () => {
    const saved = { description: "Soft and floral", sortOrder: 7 };
    expect(toActiveRequest(true, saved)).toEqual({ ...saved, active: true });
    expect(toSortOrderRequest(3, saved)).toEqual({ description: "Soft and floral", sortOrder: 3 });
    expect(toCategoryRequest(null, saved)).toEqual({ ...saved, category: null });
    expect(toCategoryRequest({ slug: "get-well", name: "Get well" }, saved)).toEqual({
      ...saved,
      category: { slug: "get-well", name: "Get well" },
    });
    // Never category or featured unless asked: those would overwrite the saved values.
    expect(toActiveRequest(false, saved)).not.toHaveProperty("category");
    expect(toActiveRequest(false, saved)).not.toHaveProperty("featured");
  });
  it("sends the chosen category and featured flag", () => {
    const category = { slug: "get-well", name: "Get well" };
    const values = { ...valid, category, featured: true };
    expect(toCreateRequest(values)).toMatchObject({ category, featured: true });
    expect(toUpdateRequest({ ...values, active: true })).toMatchObject({
      category,
      featured: true,
    });
  });
  it("leaves category and featured as they were when editing without touching them", () => {
    const category = { slug: "birthday", name: "Birthday" };
    const template = {
      id: "a".repeat(24),
      title: "T",
      description: "",
      shareId: "abc123XYZ_",
      countries: ["PK"],
      active: true,
      sortOrder: 5,
      category,
      featured: true,
    } as unknown as FeaturedTemplate;
    expect(toUpdateRequest(templateToValues(template))).toMatchObject({
      category,
      featured: true,
    });
  });
  it("clearing the category sends null", () => {
    expect(toUpdateRequest({ ...valid, active: true, category: null })).toHaveProperty(
      "category",
      null,
    );
  });
  it("rejects a category whose slug is empty or not a slug", () => {
    for (const slug of ["", "Get Well", "get--well", "-x"]) {
      const result = TemplateFormSchema.safeParse({ ...valid, category: { slug, name: "X" } });
      expect(result.success, slug).toBe(false);
    }
    expect(
      TemplateFormSchema.safeParse({ ...valid, category: { slug: "get-well", name: "Get well" } })
        .success,
    ).toBe(true);
  });
  it("round-trips a template into form values", () => {
    const template = {
      id: "a".repeat(24),
      title: "T",
      description: "",
      shareId: "abc123XYZ_",
      countries: ["PK"],
      active: false,
      sortOrder: 5,
    } as unknown as FeaturedTemplate;
    expect(templateToValues(template)).toMatchObject({ title: "T", active: false, sortOrder: 5 });
    expect(emptyTemplateValues()).toMatchObject({ category: null, featured: false });
  });
  it("validates", () => {
    expect(CreateTemplateFormSchema.safeParse(valid).success).toBe(true);
    expect(CreateTemplateFormSchema.safeParse({ ...valid, shareLink: "x" }).success).toBe(false);
    expect(TemplateFormSchema.safeParse({ ...valid, description: "x".repeat(301) }).success).toBe(
      false,
    );
    expect(TemplateFormSchema.safeParse({ ...valid, countries: [] }).success).toBe(false);
    expect(TemplateFormSchema.safeParse({ ...valid, title: " " }).success).toBe(false);
    expect(TemplateFormSchema.safeParse({ ...valid, sortOrder: 1.5 }).success).toBe(false);
    expect(TemplateFormSchema.safeParse({ ...valid, sortOrder: Number.NaN }).success).toBe(false);
  });
});
