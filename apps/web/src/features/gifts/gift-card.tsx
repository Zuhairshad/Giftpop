import type { CountryCode, PublicTemplate } from "@giftpop/contracts";
import { packagingSceneBounds } from "@giftpop/renderer";
import type { ReactElement } from "react";

import { moreItemsLabel, orderLabel, sceneWidthPercent } from "./gifts-model";

import { ButtonLink } from "@/components/ui";
import { SafeScene } from "@/features/builder/questions/safe-scene";
import { builderHref } from "@/features/builder/state";
import { formatMoney } from "@/lib/format-money";

/**
 * One ready-made gift. The picture sits in a square well and takes the scene's own shape (a
 * bouquet is wider than tall); the scene's `<svg>` is always 100% wide, so only the wrapper sizes it.
 */
export function GiftCard({
  country,
  template,
  headingId,
}: {
  country: CountryCode;
  template: PublicTemplate;
  headingId: string;
}): ReactElement {
  const bounds = packagingSceneBounds(template.packaging);
  const more = moreItemsLabel(template.itemSummary);
  return (
    <article
      aria-labelledby={headingId}
      className="bg-surface text-ink shadow-hairline flex h-full min-w-0 flex-col overflow-hidden rounded-md"
    >
      <div className="bg-warm relative grid aspect-square w-full place-items-center p-4">
        <div
          aria-hidden="true"
          style={{
            width: `${sceneWidthPercent(bounds)}%`,
            aspectRatio: `${bounds.width} / ${bounds.height}`,
          }}
        >
          <SafeScene
            design={template.design}
            packaging={template.packaging}
            items={template.items}
            fallbackClassName="size-full"
          />
        </div>
        {template.featured ? (
          <span className="bg-primary-tint text-primary-pressed absolute start-3 top-3 rounded-full px-3 py-1 text-xs font-bold">
            Featured
          </span>
        ) : null}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
        <h2
          id={headingId}
          className="font-display text-xl leading-tight font-bold tracking-tight wrap-anywhere"
        >
          {template.title}
        </h2>
        {template.description ? (
          <p className="text-muted line-clamp-3 text-sm wrap-anywhere">{template.description}</p>
        ) : null}
        <div>
          <h3 className="text-ink text-sm font-semibold">What is inside</h3>
          {template.itemSummary.names.length > 0 ? (
            <ul className="text-muted mt-1 list-disc ps-5 text-sm">
              {template.itemSummary.names.map((name, index) => (
                <li key={`${index}-${name}`} className="wrap-anywhere">
                  {name}
                </li>
              ))}
              {more ? <li className="list-none">{more}</li> : null}
            </ul>
          ) : (
            <p className="text-muted mt-1 text-sm">Items are chosen for you.</p>
          )}
        </div>
        <div className="mt-auto flex flex-col gap-3 pt-2">
          <p className="font-display text-2xl font-bold tracking-tight">
            {formatMoney(template.priceMinor, template.currency, "en")}
          </p>
          <ButtonLink
            href={builderHref(country, template.shareId)}
            // Starts with the visible text so voice control matches it.
            aria-label={orderLabel(template.title)}
            block
          >
            Order this gift
          </ButtonLink>
        </div>
      </div>
    </article>
  );
}
