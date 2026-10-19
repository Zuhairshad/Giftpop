import { describe, expect, it } from "vitest";

import {
  activeTab,
  applyTab,
  buildApiPath,
  filtersFromParams,
  filtersToSearch,
  hasAnyFilter,
  shouldCommitSearch,
} from "./filters";

const parse = (query: string) => filtersFromParams(new URLSearchParams(query));

describe("filtersFromParams", () => {
  it("reads every filter", () => {
    expect(
      parse(
        "status=packed&paymentStatus=paid&country=pk&from=2026-10-01&to=2026-10-19&search=GP-PK&hasPendingProof=true",
      ),
    ).toEqual({
      status: "packed",
      paymentStatus: "paid",
      country: "PK",
      from: "2026-10-01",
      to: "2026-10-19",
      search: "GP-PK",
      hasPendingProof: true,
    });
  });
  it("drops empty and invalid values", () => {
    expect(
      parse("status=nope&paymentStatus=&from=yesterday&search=%20%20&hasPendingProof=false"),
    ).toEqual({});
  });
  it("trims the search", () => {
    expect(parse("search=%20ali%20").search).toBe("ali");
  });
});

describe("filtersToSearch", () => {
  it("is empty without filters", () => {
    expect(filtersToSearch({})).toBe("");
    expect(hasAnyFilter({})).toBe(false);
  });
  it("leaves out empty values and round-trips", () => {
    const filters = { status: "confirmed", search: "  ", country: "AE" } as const;
    expect(filtersToSearch(filters)).toBe("?status=confirmed&country=AE");
    expect(parse(filtersToSearch(filters).slice(1))).toEqual({
      status: "confirmed",
      country: "AE",
    });
  });
});

describe("buildApiPath", () => {
  it("sends the filters, the page size and the cursor", () => {
    const path = buildApiPath({ status: "packed", search: "ali" }, "abc");
    const url = new URL(path, "http://x");
    expect(url.pathname).toBe("/admin/orders");
    expect(url.searchParams.get("status")).toBe("packed");
    expect(url.searchParams.get("search")).toBe("ali");
    expect(url.searchParams.get("cursor")).toBe("abc");
    expect(url.searchParams.get("limit")).toBe("25");
  });
  it("omits the cursor on the first page and empty filters", () => {
    expect(buildApiPath({ search: " " })).toBe("/admin/orders?limit=25");
  });
  it("never sends a bad value", () => {
    expect(buildApiPath({ from: "tomorrow" })).toBe("/admin/orders?limit=25");
  });
});

describe("quick tabs", () => {
  it("derives the tab from the URL", () => {
    expect(activeTab(parse(""))).toBe("all");
    expect(activeTab(parse("status=awaiting_payment&hasPendingProof=true"))).toBe(
      "needs_payment_check",
    );
    expect(activeTab(parse("status=confirmed"))).toBe("to_make");
    expect(activeTab(parse("status=packed"))).toBe("to_ship");
  });
  it("lights no tab for a custom view", () => {
    expect(activeTab(parse("status=shipped"))).toBeNull();
    expect(activeTab(parse("status=awaiting_payment"))).toBeNull();
    expect(activeTab(parse("hasPendingProof=true"))).toBeNull();
  });
  it("ignores other filters when deriving", () => {
    expect(activeTab(parse("country=PK&search=x"))).toBe("all");
  });
  it("switching tab sets its filters and keeps the rest", () => {
    const base = { country: "PK", search: "ali", status: "shipped" } as const;
    expect(applyTab(base, "needs_payment_check")).toEqual({
      country: "PK",
      search: "ali",
      status: "awaiting_payment",
      hasPendingProof: true,
    });
    expect(applyTab({ ...base, hasPendingProof: true }, "to_make")).toEqual({
      country: "PK",
      search: "ali",
      status: "confirmed",
    });
    expect(applyTab(base, "all")).toEqual({ country: "PK", search: "ali" });
    for (const tab of ["all", "needs_payment_check", "to_make", "to_ship"] as const) {
      expect(activeTab(applyTab(base, tab))).toBe(tab);
    }
  });
});

describe("shouldCommitSearch", () => {
  it("commits only a real change", () => {
    expect(shouldCommitSearch("ali", undefined)).toBe(true);
    expect(shouldCommitSearch("ali ", "ali")).toBe(false);
    expect(shouldCommitSearch("", undefined)).toBe(false);
    expect(shouldCommitSearch("", "ali")).toBe(true);
  });
});
