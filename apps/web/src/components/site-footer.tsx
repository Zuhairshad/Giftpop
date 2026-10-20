import Link from "next/link";

/** The shop's Instagram, the one contact channel every country shares. */
export const INSTAGRAM_URL = "https://www.instagram.com/the_giftpop";

const LINK =
  "text-ink-2 hover:bg-primary-tint hover:text-ink flex min-h-11 items-center rounded-full px-2 transition sm:px-3-colors";

function InstagramIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </svg>
  );
}

/** A slim bar (about 52px, taller only when it must wrap at 320px). The builder hides it via data-viewport-fit="builder". */
export function SiteFooter() {
  return (
    <footer className="gp-footer text-ink-2 border-t border-pink/30 bg-gradient-to-r from-primary-tint/70 via-canvas to-primary-tint/70 text-[13px] font-medium">
      <div className="gp-bar flex flex-wrap items-center justify-between gap-x-4">
        <p className="text-ink hidden items-center gap-2 py-2 font-semibold md:flex">
          <span aria-hidden="true" className="text-primary-pressed text-base">
            ♥
          </span>
          Made by hand, packed with care
        </p>
        <nav aria-label="Footer" className="-mx-2 flex flex-1 sm:-mx-3 md:flex-none">
          <ul className="flex flex-1 flex-wrap items-center gap-x-1 md:flex-none">
            <li>
              <Link href="/track" className={LINK}>
                Track an order
              </Link>
            </li>
            <li>
              <Link href="/partners" className={LINK}>
                Partner with us
              </Link>
            </li>
            <li className="ml-auto md:ml-0">
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="@the_giftpop on Instagram, opens in a new tab"
                className={`${LINK} text-primary-pressed gap-1.5 font-semibold`}
              >
                <InstagramIcon />
                @the_giftpop
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
