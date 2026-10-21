import { describe, expect, it } from "vitest";

import {
  CreateTemplateRequestSchema,
  FeaturedTemplateSchema,
  PublicTemplateSchema,
  SharedDesignViewSchema,
  TemplateCategorySlugSchema,
  TemplateListQuerySchema,
  UpdateTemplateRequestSchema,
} from "../src/index";

const create = { title: "Birthday box", shareId: "abcdefgh", countries: ["PK"] };

describe("TemplateCategorySlugSchema", () => {
  it("accepts hyphenated lower-case words and normalises case", () => {
    expect(TemplateCategorySlugSchema.parse("Get-Well")).toBe("get-well");
  });
  it("rejects spaces, double hyphens and an empty string", () => {
    for (const bad of ["get well", "get--well", "-well", "", "a".repeat(41)]) {
      expect(TemplateCategorySlugSchema.safeParse(bad).success).toBe(false);
    }
  });
});

describe("CreateTemplateRequestSchema", () => {
  it("defaults to no category and not featured", () => {
    const parsed = CreateTemplateRequestSchema.parse(create);
    expect(parsed.category).toBeNull();
    expect(parsed.featured).toBe(false);
  });
  it("takes a category", () => {
    const parsed = CreateTemplateRequestSchema.parse({
      ...create,
      category: { slug: "birthday", name: "Birthday" },
      featured: true,
    });
    expect(parsed.category).toEqual({ slug: "birthday", name: "Birthday" });
    expect(parsed.featured).toBe(true);
  });
});

describe("UpdateTemplateRequestSchema", () => {
  it("leaves category and featured out when the request omits them", () => {
    const parsed = UpdateTemplateRequestSchema.parse({ title: "New title" });
    expect("category" in parsed).toBe(false);
    expect("featured" in parsed).toBe(false);
  });
  it("leaves description and sortOrder out too, so a one-field update does not reset them", () => {
    const parsed = UpdateTemplateRequestSchema.parse({ active: false });
    expect(parsed).toEqual({ active: false });
  });
  it("lets staff clear the category with null", () => {
    expect(UpdateTemplateRequestSchema.parse({ category: null }).category).toBeNull();
  });
});

describe("FeaturedTemplateSchema", () => {
  it("reads a stored template that has no category or featured flag", () => {
    expect(FeaturedTemplateSchema.shape.category.parse(undefined)).toBeNull();
    expect(FeaturedTemplateSchema.shape.featured.parse(undefined)).toBe(false);
  });
});

describe("PublicTemplateSchema", () => {
  it("requires a whole, non-negative price in minor units", () => {
    const { priceMinor } = PublicTemplateSchema.shape;
    expect(priceMinor.safeParse(2500).success).toBe(true);
    expect(priceMinor.safeParse(25.5).success).toBe(false);
    expect(priceMinor.safeParse(-1).success).toBe(false);
  });
  it("caps the item summary at four names", () => {
    const { itemSummary } = PublicTemplateSchema.shape;
    expect(itemSummary.safeParse({ names: ["a", "b", "c", "d"], moreCount: 2 }).success).toBe(true);
    expect(itemSummary.safeParse({ names: ["a", "b", "c", "d", "e"], moreCount: 0 }).success).toBe(
      false,
    );
  });
});

describe("TemplateListQuerySchema", () => {
  it("normalises the country and makes the category optional", () => {
    expect(TemplateListQuerySchema.parse({ country: "pk" })).toEqual({ country: "PK" });
    expect(TemplateListQuerySchema.parse({ country: "pk", category: "birthday" }).category).toBe(
      "birthday",
    );
  });
});

describe("SharedDesignViewSchema.readyMade", () => {
  const { readyMade } = SharedDesignViewSchema.shape;
  it("is null when the API leaves it out, so an old response still reads", () => {
    expect(readyMade.parse(undefined)).toBeNull();
  });
  it("carries the gift's title and description", () => {
    expect(readyMade.parse({ title: "Birthday box", description: "" })).toEqual({
      title: "Birthday box",
      description: "",
    });
  });
});
