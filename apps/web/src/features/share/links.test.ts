import { describe, expect, it } from "vitest";

import {
  checkoutHref,
  makeYourOwnHref,
  orderThisGiftHref,
  reviewHref,
  shareHref,
  shareUrl,
} from "./links";

describe("share links", () => {
  it("builds the share path and the absolute url", () => {
    expect(shareHref("abcdEFGH12")).toBe("/g/abcdEFGH12");
    expect(shareUrl("https://giftpop.test", "abcdEFGH12")).toBe(
      "https://giftpop.test/g/abcdEFGH12",
    );
  });

  it("does not double the slash when the origin ends in one", () => {
    expect(shareUrl("https://giftpop.test/", "abcdEFGH12")).toBe(
      "https://giftpop.test/g/abcdEFGH12",
    );
  });

  it("lowercases the country in builder and checkout links", () => {
    expect(orderThisGiftHref("PK", "abcdEFGH12")).toBe("/pk/build?from=abcdEFGH12");
    expect(makeYourOwnHref("PK")).toBe("/pk/build");
    expect(reviewHref("AE")).toBe("/ae/build");
    expect(checkoutHref("AE")).toBe("/ae/checkout");
  });

  it("points every builder link at the one builder route, never an old step address", () => {
    const links = [
      orderThisGiftHref("AE", "abcdEFGH12"),
      makeYourOwnHref("AE"),
      reviewHref("PK"),
    ];
    for (const link of links) {
      expect(link).not.toMatch(/\/build\/(format|items|arrange|personalise|review)/);
    }
  });
});
