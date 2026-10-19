import { snapshotsToSceneDocs } from "@giftpop/contracts";
import type { PublicOrderView } from "@giftpop/contracts";
import type { ReactElement } from "react";

import { SafeScene } from "@/features/builder/steps/format/safe-scene";

/** The gift drawn from the order's frozen snapshots, with its item list. */
export function GiftPanel({
  view,
}: {
  view: Pick<PublicOrderView, "design" | "packaging" | "items">;
}): ReactElement {
  const { packaging, items } = snapshotsToSceneDocs(view);
  const { cardMessage, recipientName, itemNames } = view.design.personalisation;
  return (
    <section aria-labelledby="gift-heading" className="space-y-4">
      <h2 id="gift-heading" className="font-display text-2xl font-bold">
        Your {view.packaging.name}
      </h2>
      <div className="mx-auto w-[min(100%,28rem)] md:w-full">
        <SafeScene design={view.design} packaging={packaging} items={items} />
      </div>
      <ul className="space-y-1.5">
        {view.items.map((item) => {
          const named = itemNames[item.itemId]?.trim();
          return (
            <li key={item.itemId} className="flex flex-wrap items-baseline gap-x-2">
              <span className="font-semibold wrap-anywhere">
                {item.qty} &times; {item.name}
              </span>
              {named ? (
                <span className="text-muted text-sm wrap-anywhere">
                  named &ldquo;{named}&rdquo;
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
      {recipientName.trim() || cardMessage.trim() ? (
        <dl className="space-y-2">
          {recipientName.trim() ? (
            <div>
              <dt className="text-muted text-sm font-bold">For</dt>
              <dd className="wrap-anywhere">{recipientName}</dd>
            </div>
          ) : null}
          {cardMessage.trim() ? (
            <div>
              <dt className="text-muted text-sm font-bold">Card message</dt>
              <dd className="wrap-anywhere whitespace-pre-line">{cardMessage}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}
    </section>
  );
}
