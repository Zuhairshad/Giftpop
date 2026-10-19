import { GiftScene } from "@giftpop/renderer";
import type { ReactElement } from "react";
import { useMemo } from "react";

import type { BuilderApi } from "@/features/builder/state";
import {
  buildPersonalisationRows,
  buildReviewLines,
} from "@/features/builder/steps/review/review-lines";
import { optimisedImageUrl } from "@/lib/image-url";

/** The finished gift: the scene, the items and the personal touches. Read-only. */
export function GiftSummary({ builder }: { builder: BuilderApi }): ReactElement | null {
  const { design, packaging, catalog } = builder;
  const items = useMemo(() => catalog.items.map((priced) => priced.item), [catalog.items]);
  if (!design || !packaging) return null;

  const lines = buildReviewLines(builder.lines, catalog, builder.itemNames);
  const rows = buildPersonalisationRows({
    cardMessage: builder.cardMessage,
    recipientName: builder.recipientName,
    lines,
  });

  return (
    <section aria-labelledby="checkout-gift-heading" className="min-w-0 space-y-4">
      <h2 id="checkout-gift-heading" className="font-display text-2xl font-bold">
        Your gift
      </h2>
      <div className="mx-auto w-[min(100%,24rem)] lg:w-full">
        <GiftScene
          imageUrl={optimisedImageUrl}
          design={design}
          packaging={packaging}
          items={items}
        />
      </div>
      <div>
        <h3 className="font-bold">In your {packaging.name}</h3>
        <ul className="mt-1 space-y-1">
          {lines.map((line) => (
            <li key={line.itemId} className="wrap-anywhere">
              <span className="font-semibold">
                {line.qty} &times; {line.name}
              </span>
              {line.customName ? (
                <span className="text-muted text-sm"> named &ldquo;{line.customName}&rdquo;</span>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
      <dl className="space-y-2">
        {rows.map((row) => (
          <div key={row.label}>
            <dt className="text-muted text-sm font-bold">{row.label}</dt>
            <dd className="wrap-anywhere whitespace-pre-line">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
