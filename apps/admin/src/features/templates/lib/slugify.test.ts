import { TemplateCategorySlugSchema } from "@giftpop/contracts";
import { describe, expect, it } from "vitest";

import { slugify } from "./slugify";

describe("slugify", () => {
  it("lower-cases and hyphenates words", () => {
    expect(slugify("Get well")).toBe("get-well");
    expect(slugify("Thank you")).toBe("thank-you");
    expect(slugify("Birthday")).toBe("birthday");
  });
  it("collapses punctuation and spaces and trims the ends", () => {
    expect(slugify("  Mother's  Day!! ")).toBe("mother-s-day");
    expect(slugify("--Eid / Ramadan--")).toBe("eid-ramadan");
  });
  it("folds accents", () => {
    expect(slugify("Fête de la Musique")).toBe("fete-de-la-musique");
  });
  it("keeps digits", () => {
    expect(slugify("21st birthday")).toBe("21st-birthday");
  });
  it("returns an empty string when nothing usable is left", () => {
    expect(slugify("")).toBe("");
    expect(slugify("   ")).toBe("");
    expect(slugify("!!!")).toBe("");
    expect(slugify("生日")).toBe("");
  });
  it("never ends with a hyphen after the length cut", () => {
    const slug = slugify(`${"a".repeat(39)} bbb`);
    expect(slug).toBe("a".repeat(39));
    expect(slugify("word ".repeat(30)).length).toBeLessThanOrEqual(40);
  });
  it("always satisfies the contract slug schema when it is not empty", () => {
    const names = ["Get well", "A  B", "x-y-z", "Hello, World 2026", "ÀÉÎ õü", "a".repeat(80)];
    for (const name of names) {
      expect(TemplateCategorySlugSchema.safeParse(slugify(name)).success).toBe(true);
    }
  });
});
