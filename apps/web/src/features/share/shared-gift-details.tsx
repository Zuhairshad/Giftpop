import type { SharedDesignView } from "@giftpop/contracts";
import type { ReactElement } from "react";

import { makeYourOwnHref, orderThisGiftHref } from "./links";
import { MessageTag } from "./message-tag";
import { buildSharedItemRows, describeSharedGiftState } from "./shared-gift-view";
import type { SharedItemRow } from "./shared-gift-view";

import { ButtonLink } from "@/components/ui";

function ItemList({ rows }: { rows: readonly SharedItemRow[] }): ReactElement {
  return (
    <section aria-labelledby="shared-items-heading">
      <h2 id="shared-items-heading" className="text-ink-2 text-sm font-semibold">
        In this gift
      </h2>
      <ul className="mt-2 space-y-1.5">
        {rows.map((row) => (
          <li key={row.itemId} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className={row.unavailable ? "text-muted line-through" : "font-semibold"}>
              {row.qty} &times; {row.name}
            </span>
            {row.customName ? (
              <span className="text-muted text-sm wrap-anywhere">
                named &ldquo;{row.customName}&rdquo;
              </span>
            ) : null}
            {row.unavailable ? (
              <span className="bg-butter text-on-accent rounded-full px-2.5 py-0.5 text-xs font-semibold">
                No longer available
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The words, the item list and the two actions that sit beside the gift. */
export function SharedGiftDetails({ view }: { view: SharedDesignView }): ReactElement {
  const { cardMessage, recipientName } = view.design.personalisation;
  const rows = buildSharedItemRows(view);
  const { notices, canOrder } = describeSharedGiftState(view, rows);
  const recipient = recipientName.trim();
  const message = cardMessage.trim();

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <p className="font-script text-pink-strong text-2xl leading-none font-bold">
          Someone made this for you
        </p>
        <h1 className="display-lg text-ink mt-2 wrap-anywhere">
          {recipient ? `A gift for ${recipient}` : "A Giftpop gift"}
        </h1>
      </div>

      {message ? <MessageTag message={message} /> : null}

      <ItemList rows={rows} />

      {notices.length > 0 ? (
        <div role="note" className="bg-warm shadow-hairline space-y-1 rounded-md p-4">
          {notices.map((notice) => (
            <p key={notice} className="text-warning text-sm font-semibold wrap-anywhere">
              {notice}
            </p>
          ))}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        {canOrder ? (
          <ButtonLink href={orderThisGiftHref(view.country, view.shareId)} size="lg">
            Order this gift
          </ButtonLink>
        ) : null}
        <ButtonLink
          href={makeYourOwnHref(view.country)}
          size={canOrder ? "md" : "lg"}
          variant={canOrder ? "tint" : "primary"}
          className="sm:self-center"
        >
          Make your own
        </ButtonLink>
      </div>
    </div>
  );
}
