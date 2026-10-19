/** True when `pathname` is the nav item's page or one of its sub-pages. `/` only matches exactly. */
export function isActiveHref(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
