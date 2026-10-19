import { GiftScene } from "@giftpop/renderer";
import type { ReactElement } from "react";
import { useMemo } from "react";

import {
  buildPersonalisationRows,
  buildReviewLines,
} from "@/features/builder/questions/review/review-lines";
import type { BuilderApi } from "@/features/builder/state";
import { CARD_TITLE, META_LABEL, WELL } from "@/features/order/ui";
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
    <section
      aria-labelledby="checkout-gift-heading"
      className="min-w-0 space-y-4 lg:sticky lg:top-6"
    >
      <h2 id="checkout-gift-heading" className={CARD_TITLE}>
        Your gift
      </h2>
      <div className={`${WELL} p-4 sm:p-6`}>
        <div className="mx-auto w-[min(100%,22rem)] lg:w-full">
          <GiftScene
            imageUrl={optimisedImageUrl}
            design={design}
            packaging={packaging}
            items={items}
          />
        </div>
      </div>
      <div>
        <h3 className="font-semibold">In your {packaging.name}</h3>
        <ul className="mt-1 space-y-1">
          {lines.map((line) => (
            <li key={line.itemId} className="wrap-anywhere">
              <span className="font-semibold">
                {line.qty} &times; {line.name}
              </span>
              {line.customName ? (
                <span className="text-sm text-muted"> named &ldquo;{line.customName}&rdquo;</span>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
      <dl className="space-y-3">
        {rows.map((row) => (
          <div key={row.label}>
            <dt className={META_LABEL}>{row.label}</dt>
            <dd className="wrap-anywhere whitespace-pre-line">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
