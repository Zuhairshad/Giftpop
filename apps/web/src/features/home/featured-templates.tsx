import { GiftScene } from "@giftpop/renderer";
import Link from "next/link";

import type { TemplateCardModel } from "./view-models";

import { optimisedImageUrl } from "@/lib/image-url";

export function FeaturedTemplates({
  cards,
  countryName,
}: {
  cards: TemplateCardModel[];
  countryName: string | undefined;
}) {
  return (
    <section aria-labelledby="templates-heading">
      <h2 id="templates-heading" className="font-display text-3xl font-bold">
        {countryName ? `Gift ideas for ${countryName}` : "Gift ideas"}
      </h2>
      <p className="text-muted mt-2">Start from a gift we love and make it your own.</p>
      <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <li
            key={card.id}
            className="border-border bg-surface rounded-card flex flex-col overflow-hidden border"
          >
            <div className="bg-surface-soft aspect-square w-full">
              <GiftScene
                imageUrl={optimisedImageUrl}
                design={card.design}
                packaging={card.packaging}
                items={card.items}
                className="h-full w-full"
              />
            </div>
            <div className="flex flex-1 flex-col p-5">
              <h3 className="font-display text-xl font-bold wrap-anywhere">{card.title}</h3>
              {card.description ? (
                <p className="text-muted mt-1 wrap-anywhere">{card.description}</p>
              ) : null}
              <Link
                href={card.href}
                // Starts with the visible text, so voice control matches it (W9). An sr-only span
                // would not do: Chrome adds a space before it ("Start from this : …").
                aria-label={`Start from this: ${card.title}`}
                className="bg-pink-strong text-on-pink hover:bg-pink mt-4 inline-block self-start rounded-full px-5 py-2.5 text-sm font-bold transition-colors"
              >
                Start from this
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
