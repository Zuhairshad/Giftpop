import { describe, expect, it } from "vitest";

import { itemsQueryString, pageCount, parseItemsQuery } from "./items-query";

describe("parseItemsQuery", () => {
  it("reads search, category, active and page", () => {
    expect(
      parseItemsQuery({ search: " rose ", category: "flowers", active: "true", page: "3" }),
    ).toMatchObject({ search: "rose", category: "flowers", active: true, page: 3, pageSize: 20 });
  });

  it("uses defaults for an empty query", () => {
    expect(parseItemsQuery({})).toEqual({ page: 1, pageSize: 20 });
  });

  it("falls back to defaults for bad values", () => {
    expect(parseItemsQuery({ page: "-2", active: "maybe" })).toEqual({ page: 1, pageSize: 20 });
  });

  it("takes the first of repeated params", () => {
    expect(parseItemsQuery({ category: ["a", "b"] }).category).toBe("a");
  });
});

describe("itemsQueryString", () => {
  it("leaves out defaults", () => {
    expect(itemsQueryString({})).toBe("");
    expect(itemsQueryString({ page: 1, search: "  " })).toBe("");
  });

  it("writes the filters", () => {
    expect(itemsQueryString({ search: "rose", category: "flowers", active: false, page: 2 })).toBe(
      "?search=rose&category=flowers&active=false&page=2",
    );
  });

  it("encodes special characters", () => {
    expect(itemsQueryString({ search: "a&b c" })).toBe("?search=a%26b+c");
  });
});

describe("pageCount", () => {
  it("is at least one page", () => {
    expect(pageCount(0, 20)).toBe(1);
    expect(pageCount(20, 20)).toBe(1);
    expect(pageCount(21, 20)).toBe(2);
  });
});
