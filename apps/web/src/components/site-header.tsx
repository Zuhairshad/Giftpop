import { cookies } from "next/headers";
import Link from "next/link";

import { Logo } from "@/components/logo";
import { HeaderCountryPicker, HeaderCountrySuggestion } from "@/features/country";
import { COUNTRY_COOKIE, validCountryCode } from "@/features/country/cookie";

const NAV_LINKS = [
  { href: "/track", label: "Track an order" },
  { href: "/partners", label: "Partner with us" },
] as const;

/**
 * Full width with the page gutter on every page (.gp-bar), so the logo sits at the same x everywhere.
 * 64px tall (56px on phones): logo left, country picker right. On phones "Track an order" and
 * "Partner with us" live in the footer bar so the header never crowds; from 768px they show here too.
 */
export async function SiteHeader() {
  // "Ready-made gifts" is a page of one country's catalog, so it shows once we know the visitor's country.
  const country = validCountryCode((await cookies()).get(COUNTRY_COOKIE)?.value);
  const links = country
    ? [{ href: `/${country.toLowerCase()}/gifts`, label: "Ready-made gifts" }, ...NAV_LINKS]
    : NAV_LINKS;
  return (
    <>
      {/* In flow above the sticky header: it pushes the page down and scrolls away with it. */}
      <HeaderCountrySuggestion />
      <header className="gp-header bg-canvas/90 sticky top-0 z-40 shadow-[0_1px_0_var(--gp-border)] backdrop-blur">
        <div className="gp-bar relative flex h-14 items-center justify-between gap-3 md:h-16">
          <Logo />

          <div className="flex min-w-0 items-center gap-1">
            <nav aria-label="Main" className="hidden md:block">
              <ul className="flex items-center gap-1 text-sm font-medium">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-ink-2 hover:bg-warm hover:text-ink flex min-h-11 items-center rounded-md px-3 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <HeaderCountryPicker />
          </div>
        </div>
      </header>
    </>
  );
}
