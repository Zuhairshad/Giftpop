import type { StaffRole } from "@giftpop/contracts";

import type { NavItem } from "@/config/nav";

/** Hides `ownerOnly` areas from staff. This is for tidiness; the pages and API enforce it. */
export function visibleNavItems(items: readonly NavItem[], role: StaffRole): NavItem[] {
  return items.filter((item) => !item.ownerOnly || role === "owner");
}
