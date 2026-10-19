import Link from "next/link";

import type { FormatCardModel } from "./view-models";

export function FormatStrip({ cards }: { cards: FormatCardModel[] }) {
  return (
    <section aria-labelledby="formats-heading">
      <h2 id="formats-heading" className="font-display text-3xl font-bold">
        Pick a gift format
      </h2>
      <p className="text-muted mt-2">Every format is made and packed by hand.</p>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <li key={card.id}>
            <Link
              href={card.href}
              aria-label={`${card.name}. ${card.pickCopy}. ${card.priceCopy}. Choose this format`}
              className="border-border bg-surface rounded-card hover:bg-surface-soft flex h-full gap-4 border p-5 transition-colors"
            >
              <svg
                viewBox="0 0 64 64"
                width="64"
                height="64"
                className="h-16 w-16 shrink-0"
                aria-hidden="true"
                focusable="false"
              >
                <rect width="64" height="64" rx="18" fill="var(--gp-surface-soft)" />
                <rect x="14" y="26" width="36" height="26" rx="6" fill={card.wrapperColor} />
                <rect x="30" y="26" width="4" height="26" fill={card.ribbonColor} />
                <circle cx="32" cy="22" r="6" fill={card.ribbonColor} />
              </svg>
              <span className="min-w-0">
                <span className="font-display block text-xl font-bold wrap-anywhere">
                  {card.name}
                </span>
                <span className="text-pink-strong block font-bold">{card.pickCopy}</span>
                {card.description ? (
                  <span className="text-muted block text-sm wrap-anywhere">{card.description}</span>
                ) : null}
                <span className="text-muted mt-1 block text-sm">{card.priceCopy}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
