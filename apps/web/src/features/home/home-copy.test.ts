import { describe, expect, it } from "vitest";

import {
  countryDisplayName,
  countryTicks,
  deliveryTick,
  HOME_EYEBROW,
  HOME_LEDE,
  HOME_HEADLINE,
  homeMeta,
  homeTicks,
} from "./home-copy";
import { homeMetadata } from "./home-metadata";

function country(over: { min?: number; max?: number; modes?: ("prepaid" | "cod")[] } = {}) {
  return {
    shipping: {
      flatMinor: 0,
      deliveryDays: { min: over.min ?? 3, max: over.max ?? 5 },
    },
    paymentModes: over.modes ?? ["prepaid", "cod"],
  };
}

describe("homeHeadline", () => {
  it("is the same in every country and names none", () => {
    expect(HOME_HEADLINE).not.toMatch(/ in /);
  });

  it("never says the same thing twice across eyebrow, headline, lede and ticks", () => {
    const lines = [HOME_EYEBROW, HOME_HEADLINE, HOME_LEDE, ...homeTicks(country())];
    const handmade = lines.filter((line) => /hand\s*made|made by hand/i.test(line));
    expect(handmade).toHaveLength(2); // the h1 ("Handmade ...") and one factual tick
    expect(HOME_EYEBROW).not.toMatch(/hand/i);
  });
});

describe("countryDisplayName", () => {
  it("uses the document's name", () => {
    expect(countryDisplayName("PK", { name: "Pakistan" })).toBe("Pakistan");
  });

  it("falls back to the code from the URL when the document is missing", () => {
    expect(countryDisplayName("PK", null)).toBe("PK");
  });
});

describe("deliveryTick", () => {
  it.each([
    [{ min: 3, max: 5 }, "3 to 5 day delivery"],
    [{ min: 2, max: 2 }, "2 day delivery"],
    [{ min: 1, max: 1 }, "1 day delivery"],
    [{ min: 0, max: 3 }, "Delivery within 3 days"],
    [{ min: 0, max: 1 }, "Delivery within 1 day"],
    [{ min: 0, max: 0 }, "Same day delivery"],
  ])("%j reads %s", (days, copy) => {
    expect(deliveryTick(days)).toBe(copy);
  });
});

describe("countryTicks and homeTicks", () => {
  it("adds delivery and cash on delivery when the country allows cod", () => {
    expect(countryTicks(country())).toEqual(["3 to 5 day delivery", "Cash on delivery"]);
    expect(homeTicks(country())).toEqual([
      "Made by hand",
      "Packed with care",
      "3 to 5 day delivery",
      "Cash on delivery",
    ]);
  });

  it("leaves out cash on delivery when the country is prepaid only", () => {
    expect(countryTicks(country({ modes: ["prepaid"] }))).toEqual(["3 to 5 day delivery"]);
  });

  it("returns nothing from data when the country document is missing", () => {
    expect(countryTicks(null)).toEqual([]);
    expect(homeTicks(null)).toEqual(["Made by hand", "Packed with care"]);
  });

  it("never mentions a price", () => {
    expect(homeTicks(country()).join(" ")).not.toMatch(/\d{3,}|from/i);
  });
});

describe("homeMeta and homeMetadata", () => {
  it("names the country in the title, description, canonical and Open Graph", () => {
    const meta = homeMetadata({ code: "PK", name: "Pakistan" });
    expect(meta.title).toBe("Handmade gift boxes & bouquets in Pakistan");
    expect(meta.description).toContain("Pakistan");
    expect(meta.alternates?.canonical).toBe("/pk");
    expect(meta.openGraph).toMatchObject({ url: "/pk", siteName: "The Giftpop" });
  });

  it("is generic on `/`", () => {
    expect(homeMeta({})).toMatchObject({ path: "/", title: HOME_HEADLINE });
    expect(homeMetadata().alternates?.canonical).toBe("/");
  });

  it("falls back to the generic page when a code has no name", () => {
    expect(homeMeta({ code: "PK" }).path).toBe("/");
  });
});
