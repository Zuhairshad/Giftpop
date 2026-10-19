export interface NavItem {
  title: string;
  href: string;
  /** Only owners see and may open this area. */
  ownerOnly?: boolean;
}

export const navItems: readonly NavItem[] = [
  { title: "Dashboard", href: "/" },
  { title: "Orders", href: "/orders" },
  { title: "Catalog", href: "/catalog" },
  { title: "Countries", href: "/countries", ownerOnly: true },
  { title: "Partners", href: "/partners" },
  { title: "Templates", href: "/templates" },
  { title: "Staff", href: "/staff", ownerOnly: true },
];
