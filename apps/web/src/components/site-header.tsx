import Link from "next/link";

const NAV_LINKS = [
  { href: "/#choose-country", label: "Build a gift" },
  { href: "/track", label: "Track an order" },
  { href: "/partners", label: "Partner with us" },
] as const;

export function SiteHeader() {
  return (
    <header className="border-border bg-background/90 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="font-display text-pink-strong text-2xl font-bold tracking-tight"
          aria-label="The Giftpop, home"
        >
          The Giftpop
        </Link>

        <Link
          href="/#choose-country"
          aria-label="Choose your country. No country chosen yet."
          className="border-border bg-surface text-foreground hover:bg-surface-soft rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors"
        >
          <span aria-hidden="true">Country: </span>
          <span className="text-pink-strong">Choose</span>
        </Link>

        <nav aria-label="Main" className="order-last w-full sm:order-none sm:w-auto">
          <ul className="-mx-1 flex flex-wrap gap-1 text-sm font-semibold">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-muted hover:bg-surface-soft hover:text-foreground block rounded-full px-3 py-1.5 transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
