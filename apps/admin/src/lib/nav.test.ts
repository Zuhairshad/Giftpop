import { describe, expect, it } from "vitest";

import { isActiveHref } from "./nav";

import { navItems } from "@/config/nav";

describe("isActiveHref", () => {
  it("matches the dashboard only on /", () => {
    expect(isActiveHref("/", "/")).toBe(true);
    expect(isActiveHref("/orders", "/")).toBe(false);
  });

  it("matches a section and its sub-pages", () => {
    expect(isActiveHref("/orders", "/orders")).toBe(true);
    expect(isActiveHref("/orders/GP-PK-7K2M9Q", "/orders")).toBe(true);
  });

  it("does not match a sibling that shares a prefix", () => {
    expect(isActiveHref("/orders-archive", "/orders")).toBe(false);
  });

  it("marks exactly one nav item active for each nav href", () => {
    for (const item of navItems) {
      const active = navItems.filter((other) => isActiveHref(item.href, other.href));
      expect(active.map((n) => n.href)).toEqual([item.href]);
    }
  });
});
