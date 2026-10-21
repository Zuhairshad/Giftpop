import Link from "next/link";
import type { ReactElement, ReactNode } from "react";

import { StatePanel } from "@/components/placeholder-page";
import { ButtonLink } from "@/components/ui";

/** Nothing to show: a calm panel with one way forward (`actions`). */
export function GiftsEmpty({
  title,
  children,
  actions,
}: {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
}): ReactElement {
  return (
    <StatePanel headingId="gifts-empty-heading" title={title} role="status" actions={actions}>
      {children}
    </StatePanel>
  );
}

/** The gifts could not be loaded. The link reloads this same address. */
export function GiftsUnavailable({ href }: { href: string }): ReactElement {
  return (
    <StatePanel
      headingId="gifts-unavailable-heading"
      script="Something slipped"
      title="We could not load the gifts"
      actions={
        <>
          <ButtonLink href={href} prefetch={false}>
            Try again
          </ButtonLink>
          <Link
            href="/"
            className="text-ink inline-flex min-h-11 items-center justify-center px-3 text-sm font-semibold underline underline-offset-4"
          >
            Go to the home page
          </Link>
        </>
      }
    >
      Something went wrong on our side. Nothing was lost. Try again in a moment.
    </StatePanel>
  );
}

/** A chip with no gifts, or an address with an unknown occasion: say so and link back to all gifts. */
export function NoGiftsInCategory({ allHref }: { allHref: string }): ReactElement {
  return (
    <section
      aria-labelledby="gifts-none-heading"
      className="bg-surface shadow-hairline flex flex-col items-start gap-3 rounded-md p-6"
    >
      <h2 id="gifts-none-heading" className="font-display text-xl font-bold tracking-tight">
        No gifts for that occasion
      </h2>
      <p className="text-muted">We could not find any gifts for that occasion in this country.</p>
      <ButtonLink href={allHref}>Show all gifts</ButtonLink>
    </section>
  );
}
