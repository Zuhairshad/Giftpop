import { describe, expect, it } from "vitest";

import { suggestionHiddenOn } from "./suggestion-visibility";

describe("suggestionHiddenOn", () => {
  it.each(["/pk/build/format", "/PK/build/review", "/us/build", "/pk/checkout", "/pk/checkout/"])(
    "hides it on %s",
    (path) => {
      expect(suggestionHiddenOn(path)).toBe(true);
    },
  );

  it.each(["/", "/pk", "/countries", "/track", "/partners/brands", "/g/abcdEFGH12", "/order/GP-1"])(
    "shows it on %s",
    (path) => {
      expect(suggestionHiddenOn(path)).toBe(false);
    },
  );

  it("does not treat a country called build as a builder path", () => {
    expect(suggestionHiddenOn("/build")).toBe(false);
  });
});
