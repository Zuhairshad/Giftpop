import { snapshotsToSceneDocs } from "@giftpop/contracts";
import type { PublicOrderView } from "@giftpop/contracts";
import type { ReactElement } from "react";

import { CARD_TITLE, META_LABEL, WELL } from "./ui";

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
      <h2 id="gift-heading" className={CARD_TITLE}>
        Your {view.packaging.name}
      </h2>
      <div className={`${WELL} p-4 sm:p-6`}>
        <div className="mx-auto w-[min(100%,28rem)] md:w-full">
          <SafeScene design={view.design} packaging={packaging} items={items} />
        </div>
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
                <span className="text-sm text-muted wrap-anywhere">
                  named &ldquo;{named}&rdquo;
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
      {recipientName.trim() || cardMessage.trim() ? (
        <dl className="space-y-3 rounded-lg bg-surface p-4 shadow-hairline">
          {recipientName.trim() ? (
            <div>
              <dt className={META_LABEL}>For</dt>
              <dd className="wrap-anywhere">{recipientName}</dd>
            </div>
          ) : null}
          {cardMessage.trim() ? (
            <div>
              <dt className={META_LABEL}>Card message</dt>
              <dd className="wrap-anywhere whitespace-pre-line">{cardMessage}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}
    </section>
  );
}
