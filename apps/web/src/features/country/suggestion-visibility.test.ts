import { describe, expect, it } from "vitest";

import { suggestionHiddenOn } from "./suggestion-visibility";

describe("suggestionHiddenOn", () => {
  it.each([
    "/pk/build/format",
    "/PK/build/review",
    "/us/build",
    "/pk/checkout",
    "/pk/checkout/",
    "/order/GP-1",
    "/order/GP-PK-K8S1H0/",
    "/track",
    "/track/",
  ])("hides it on %s", (path) => {
    expect(suggestionHiddenOn(path)).toBe(true);
  });

  it.each(["/", "/pk", "/countries", "/partners", "/partners/countries", "/g/abcdEFGH12"])(
    "shows it on %s",
    (path) => {
      expect(suggestionHiddenOn(path)).toBe(false);
    },
  );

  it("only treats order and track as the first segment", () => {
    expect(suggestionHiddenOn("/pk/order")).toBe(false);
    expect(suggestionHiddenOn("/pk/track")).toBe(false);
  });

  it("does not treat a country called build as a builder path", () => {
    expect(suggestionHiddenOn("/build")).toBe(false);
  });
});
