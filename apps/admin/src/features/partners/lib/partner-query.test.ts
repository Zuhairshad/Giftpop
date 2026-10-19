import { describe, expect, it } from "vitest";

import {
  pageCount,
  parsePartnerFilters,
  partnerApiQuery,
  partnerQueryString,
} from "./partner-query";

const parse = (query: string) => parsePartnerFilters(new URLSearchParams(query));

describe("partner filters", () => {
  it("defaults to brand requests on page 1", () => {
    expect(parse("")).toEqual({ kind: "brand", status: undefined, country: undefined, page: 1 });
  });
  it("reads every filter and upper-cases the country", () => {
    expect(parse("kind=country&status=in_talks&country=pk&page=3")).toEqual({
      kind: "country",
      status: "in_talks",
      country: "PK",
      page: 3,
    });
  });
  it("ignores bad values", () => {
    expect(parse("kind=x&status=done&country=Pakistan&page=-2")).toEqual({
      kind: "brand",
      status: undefined,
      country: undefined,
      page: 1,
    });
    expect(parse("page=1.5").page).toBe(1);
  });
  it("round-trips through the page query, leaving defaults out", () => {
    expect(partnerQueryString(parse(""))).toBe("");
    const filters = parse("kind=country&status=new&country=AE&page=2");
    expect(partnerQueryString(filters)).toBe("?kind=country&status=new&country=AE&page=2");
    expect(parse(partnerQueryString(filters).slice(1))).toEqual(filters);
  });
  it("always names kind and page size for the API", () => {
    expect(partnerApiQuery(parse(""), 20)).toBe("?kind=brand&pageSize=20");
    expect(partnerApiQuery(parse("status=new&page=2"), 10)).toBe(
      "?kind=brand&status=new&page=2&pageSize=10",
    );
  });
  it("counts pages", () => {
    expect(pageCount(0, 20)).toBe(1);
    expect(pageCount(41, 20)).toBe(3);
  });
});
