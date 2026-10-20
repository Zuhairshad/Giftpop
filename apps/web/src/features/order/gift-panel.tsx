import { snapshotsToSceneDocs } from "@giftpop/contracts";
import type { PublicOrderView } from "@giftpop/contracts";
import type { ReactElement } from "react";

import { visibleCustomRequest } from "./gift-request";
import { ItemList } from "./item-list";
import { CARD, CARD_TITLE, META_LABEL, WELL } from "./ui";

import { SafeScene } from "@/features/builder/questions/safe-scene";

/** The gift drawn from the order's frozen snapshots, with its item list and card. */
export function GiftPanel({
  view,
}: {
  view: Pick<PublicOrderView, "design" | "packaging" | "items">;
}): ReactElement {
  const { packaging, items } = snapshotsToSceneDocs(view);
  const byId = new Map(items.map((item) => [item.id, item]));
  const { cardMessage, recipientName, itemNames } = view.design.personalisation;
  const recipient = recipientName.trim();
  const message = cardMessage.trim();
  const request = visibleCustomRequest(view.design.personalisation.customRequest);
  const rows = view.items.map((item) => ({
    key: item.itemId,
    name: item.name,
    qty: item.qty,
    item: byId.get(item.itemId),
    customName: itemNames[item.itemId]?.trim() || null,
  }));

  return (
    <section aria-labelledby="gift-heading" className={`${CARD} space-y-5`}>
      <h2 id="gift-heading" className={`${CARD_TITLE} wrap-anywhere`}>
        Your {view.packaging.name}
      </h2>
      <div className={`${WELL} p-4 sm:p-6`}>
        <div className="mx-auto w-[min(100%,20rem)]">
          <SafeScene design={view.design} packaging={packaging} items={items} />
        </div>
      </div>
      <ItemList rows={rows} />
      {recipient || message || request ? (
        <dl className="border-border space-y-3 border-t pt-4">
          {recipient ? (
            <div>
              <dt className={META_LABEL}>For</dt>
              <dd className="wrap-anywhere">{recipient}</dd>
            </div>
          ) : null}
          {message ? (
            <div>
              <dt className={META_LABEL}>Card message</dt>
              <dd className="wrap-anywhere whitespace-pre-line">{message}</dd>
            </div>
          ) : null}
          {request ? (
            <div>
              <dt className={META_LABEL}>Your request</dt>
              <dd className="wrap-anywhere whitespace-pre-line">{request}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}
    </section>
  );
}
