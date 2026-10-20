import Link from "next/link";

/** The shop's Instagram, the one contact channel every country shares. */
export const INSTAGRAM_URL = "https://www.instagram.com/the_giftpop";

const LINK =
  "hover:text-ink flex min-h-11 items-center rounded-md px-1 underline-offset-4 sm:px-2 transition-colors hover:underline";

/** A slim bar (44px, taller only when it must wrap at 320px). The builder hides it via data-viewport-fit="builder". */
export function SiteFooter() {
  return (
    <footer className="gp-footer bg-canvas/80 text-ink-2 text-[13px] shadow-[0_-1px_0_var(--gp-border)] font-medium">
      <nav aria-label="Footer" className="gp-bar">
        <ul className="flex flex-wrap items-center gap-x-0 sm:gap-x-1">
          <li className="-ml-1 sm:-ml-2">
            <Link href="/track" className={LINK}>
              Track an order
            </Link>
          </li>
          <li>
            <Link href="/partners" className={LINK}>
              Partner with us
            </Link>
          </li>
          <li className="-mr-1 ml-auto sm:-mr-2">
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="@the_giftpop on Instagram, opens in a new tab"
              className={LINK}
            >
              @the_giftpop
            </a>
          </li>
        </ul>
      </nav>
    </footer>
  );
}
