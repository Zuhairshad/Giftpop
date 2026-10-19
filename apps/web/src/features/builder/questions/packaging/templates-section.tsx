import type { CountryCode } from "@giftpop/contracts";
import Link from "next/link";
import type { ReactElement } from "react";

import { SafeScene } from "../safe-scene";

import { templateLinkLabel, templateStartHref } from "./template-href";

import type { TemplateCardModel } from "@/features/home/view-models";

/**
 * "Start from a ready-made gift": the featured templates for this country, each opening the
 * builder pre-filled. Shows nothing when there are none. No price: it comes from a quote.
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
      <h3 id="builder-templates-heading" className="text-foreground text-base font-semibold">
        Start from a ready-made gift
      </h3>
      <ul className="mt-2 grid grid-cols-1 gap-2 min-[560px]:grid-cols-2">
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
              <Link
                href={templateStartHref(country, card.href)}
                // Starts with the visible text so voice control matches it; an sr-only span would
                // make Chrome add a space ("Start from this : ...").
                aria-label={templateLinkLabel(card.title)}
                className="text-pink-strong mt-auto inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4"
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
