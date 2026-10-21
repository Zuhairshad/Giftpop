import type { CountryCode } from "@giftpop/contracts";
import Link from "next/link";
import type { ReactElement } from "react";

import { priceLabel } from "../price-label";
import { SafeScene } from "../safe-scene";

import { TemplateStartLink } from "./template-start-link";

import { giftsPath, type TemplateCardModel } from "@/features/home/view-models";

/**
 * "Start from a ready-made gift": the featured templates for this country, each opening the
 * builder pre-filled, with the price the API worked out for it (shown, never sent back), and a
 * link to the full catalog. Shows nothing when there are none.
 */
export function TemplatesSection({
  country,
  templates,
}: {
  country: CountryCode;
  templates: readonly TemplateCardModel[];
}): ReactElement | null {
  if (templates.length === 0) return null;
  return (
    <section aria-labelledby="builder-templates-heading" className="mt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <h3 id="builder-templates-heading" className="text-foreground text-base font-semibold">
          Start from a ready-made gift
        </h3>
        <Link
          href={giftsPath(country)}
          className="text-pink-strong inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4"
        >
          See all ready-made gifts
        </Link>
      </div>
      <ul className="grid grid-cols-1 gap-2 min-[560px]:grid-cols-2">
        {templates.map((card) => (
          <li key={card.id} className="bg-surface rounded-md shadow-hairline flex gap-3 p-2">
            <div
              className="bg-warm rounded-sm grid size-24 shrink-0 place-items-center p-1"
              aria-hidden="true"
            >
              <SafeScene
                design={card.design}
                packaging={card.packaging}
                items={card.items}
                className="w-full"
                fallbackClassName="size-full"
              />
            </div>
            <div className="flex min-w-0 flex-1 flex-col items-start gap-1 py-1 pr-1">
              <h4 className="text-foreground text-sm leading-tight font-semibold wrap-anywhere">
                {card.title}
              </h4>
              {card.description ? (
                <p className="text-muted line-clamp-2 text-xs leading-snug wrap-anywhere">
                  {card.description}
                </p>
              ) : null}
              <p className="text-foreground text-sm font-semibold">
                {priceLabel(card.priceMinor, card.currency)}
              </p>
              <TemplateStartLink country={country} cardHref={card.href} title={card.title} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
