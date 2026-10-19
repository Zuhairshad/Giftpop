import type { FeaturedTemplate } from "@giftpop/contracts";
import { describe, expect, it } from "vitest";

import {
  CreateTemplateFormSchema,
  TemplateFormSchema,
  emptyTemplateValues,
  templateToValues,
  toActiveRequest,
  toCreateRequest,
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
    });
    expect(toActiveRequest(true)).toEqual({ active: true });
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
