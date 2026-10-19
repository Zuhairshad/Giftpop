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
    expect(orderThisGiftHref("PK", "abcdEFGH12")).toBe("/pk/build/review?from=abcdEFGH12");
    expect(makeYourOwnHref("PK")).toBe("/pk/build/format");
    expect(reviewHref("AE")).toBe("/ae/build/review");
    expect(checkoutHref("AE")).toBe("/ae/checkout");
  });
});
