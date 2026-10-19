import { describe, expect, it } from "vitest";

import { safeNextPath } from "./safe-next";

describe("safeNextPath", () => {
  it.each(["/orders", "/catalog/items?q=rose", "/staff#top", "/orders/GP-PK-7K2M9Q"])(
    "keeps the same-origin path %s",
    (path) => {
      expect(safeNextPath(path)).toBe(path);
    },
  );

  it.each([
    undefined,
    null,
    "",
    "orders",
    "https://evil.example/orders",
    "//evil.example",
    "///evil.example",
    "/\\evil.example",
    "/\t/evil.example",
    "/\n/evil.example",
    "javascript:alert(1)",
    "/login",
    "/login?next=/orders",
    "/login/extra",
  ])("falls back to / for %j", (value) => {
    expect(safeNextPath(value)).toBe("/");
  });

  it("uses the first value when the param is repeated", () => {
    expect(safeNextPath(["/orders", "//evil.example"])).toBe("/orders");
    expect(safeNextPath(["//evil.example", "/orders"])).toBe("/");
  });

  it("does not block paths that merely start with the word login", () => {
    expect(safeNextPath("/loginfo")).toBe("/loginfo");
  });
});
