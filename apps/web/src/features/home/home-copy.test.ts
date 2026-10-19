import { describe, expect, it } from "vitest";

import {
  countryDisplayName,
  countryTicks,
  deliveryTick,
  homeHeadline,
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
  it("names the country and marks it for the highlight", () => {
    expect(homeHeadline("Pakistan")).toEqual({
      before: "Handmade gift boxes & bouquets in ",
      highlight: "Pakistan",
    });
  });

  it("is the generic line, with nothing highlighted, when no country is chosen", () => {
    expect(homeHeadline()).toEqual({
      before: "Handmade gift boxes & bouquets, made by hand",
      highlight: null,
    });
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
    expect(homeMeta({})).toMatchObject({ path: "/", title: homeHeadline().before });
    expect(homeMetadata().alternates?.canonical).toBe("/");
  });

  it("falls back to the generic page when a code has no name", () => {
    expect(homeMeta({ code: "PK" }).path).toBe("/");
  });
});
