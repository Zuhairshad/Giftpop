import type { SharedDesignView } from "@giftpop/contracts";
import { GiftScene } from "@giftpop/renderer";
import Link from "next/link";
import type { ReactElement } from "react";

import { GiftReveal } from "./gift-reveal";
import { InertChrome } from "./inert-chrome";
import { makeYourOwnHref, orderThisGiftHref } from "./links";
import { buildSharedItemRows, describeSharedGiftState } from "./shared-gift-view";
import type { SharedItemRow } from "./shared-gift-view";

const PRIMARY_LINK =
  "bg-pink text-on-pink hover:bg-pink-strong inline-flex items-center justify-center rounded-full px-6 py-3 text-base font-bold transition-colors";
const SECONDARY_LINK =
  "border-border bg-surface text-foreground hover:bg-surface-soft inline-flex items-center justify-center rounded-full border px-6 py-3 text-base font-bold transition-colors";

function ItemList({ rows }: { rows: readonly SharedItemRow[] }): ReactElement {
  return (
    <section aria-labelledby="shared-items-heading">
      <h2
        id="shared-items-heading"
        className="text-muted text-sm font-bold tracking-wide uppercase"
      >
        In this gift
      </h2>
      <ul className="mt-2 space-y-1.5">
        {rows.map((row) => (
          <li key={row.itemId} className="flex flex-wrap items-baseline gap-x-2">
            <span className={row.unavailable ? "text-muted line-through" : "font-semibold"}>
              {row.qty} &times; {row.name}
            </span>
            {row.customName ? (
              <span className="text-muted text-sm">named &ldquo;{row.customName}&rdquo;</span>
            ) : null}
            {row.unavailable ? (
              <span className="bg-butter text-on-accent rounded-full px-2.5 py-0.5 text-xs font-bold">
                No longer available
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The full-screen view of a shared gift. Covers the site chrome so the gift is the whole page. */
export function SharedGiftScreen({ view }: { view: SharedDesignView }): ReactElement {
  const { cardMessage, recipientName } = view.design.personalisation;
  const rows = buildSharedItemRows(view);
  const { notices, canOrder } = describeSharedGiftState(view, rows);
  const recipient = recipientName.trim();
  const message = cardMessage.trim();

  const scene = <GiftScene design={view.design} packaging={view.packaging} items={view.items} />;

  const details = (
    <div className="space-y-6">
      <div>
        <p className="text-pink-strong text-sm font-bold tracking-wide uppercase">
          Someone made this for you
        </p>
        <h1 className="font-display mt-1 text-4xl font-bold sm:text-5xl">
          {recipient ? `A gift for ${recipient}` : "A Giftpop gift"}
        </h1>
      </div>

      {message ? (
        <figure className="bg-surface border-border shadow-pop rounded-card border p-5">
          <blockquote className="font-display text-lg leading-relaxed wrap-anywhere whitespace-pre-line">
            {message}
          </blockquote>
        </figure>
      ) : null}

      <ItemList rows={rows} />

      {notices.length > 0 ? (
        <div
          role="note"
          className="bg-surface-soft border-border rounded-soft space-y-1 border p-4"
        >
          {notices.map((notice) => (
            <p key={notice} className="text-sm font-semibold">
              {notice}
            </p>
          ))}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        {canOrder ? (
          <Link href={orderThisGiftHref(view.country, view.shareId)} className={PRIMARY_LINK}>
            Order this gift
          </Link>
        ) : null}
        <Link
          href={makeYourOwnHref(view.country)}
          className={canOrder ? SECONDARY_LINK : PRIMARY_LINK}
        >
          Make your own
        </Link>
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-[60] overflow-y-auto"
      style={{
        background:
          "radial-gradient(ellipse at 50% 0%, var(--gp-pink-soft) 0%, transparent 60%), var(--gp-bg)",
      }}
    >
      <InertChrome />
      <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col px-4 py-5 sm:px-6">
        <header>
          <Link
            href="/"
            className="font-display text-pink-strong text-2xl font-bold tracking-tight"
            aria-label="The Giftpop, home"
          >
            The Giftpop
          </Link>
        </header>
        <div id="gift" className="flex flex-1 flex-col justify-center py-6">
          <GiftReveal scene={scene} details={details} />
        </div>
      </div>
    </div>
  );
}
