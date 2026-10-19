import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-border bg-surface-soft border-t">
      <div className="text-muted mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          <span className="font-display text-pink-strong text-lg font-bold">The Giftpop</span>
          <span className="block">Every gift is made and packed by hand.</span>
        </p>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-5 gap-y-2 font-semibold">
            <li>
              <Link
                href="/track"
                className="hover:text-foreground underline-offset-4 hover:underline"
              >
                Track an order
              </Link>
            </li>
            <li>
              <Link
                href="/partners"
                className="hover:text-foreground underline-offset-4 hover:underline"
              >
                Partner with us
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
