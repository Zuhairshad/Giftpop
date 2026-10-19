import { describe, expect, it } from "vitest";

import { visibleNavItems } from "./nav-access";

import { navItems } from "@/config/nav";

describe("visibleNavItems", () => {
  it("shows every item to an owner", () => {
    expect(visibleNavItems(navItems, "owner")).toEqual([...navItems]);
  });

  it("hides owner-only items from staff", () => {
    const hrefs = visibleNavItems(navItems, "staff").map((item) => item.href);
    expect(hrefs).not.toContain("/staff");
    expect(hrefs).not.toContain("/countries");
    expect(hrefs).toContain("/orders");
  });
});
