import type { SharedDesignView } from "@giftpop/contracts";
import type { ReactElement } from "react";

import { makeYourOwnHref, orderThisGiftHref } from "./links";
import { buildSharedItemRows, describeSharedGiftState } from "./shared-gift-view";
import type { SharedItemRow } from "./shared-gift-view";

import { ButtonLink } from "@/components/ui";

function ItemList({ rows }: { rows: readonly SharedItemRow[] }): ReactElement {
  return (
    <section aria-labelledby="shared-items-heading">
      <h2 id="shared-items-heading" className="text-muted text-sm font-semibold">
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

/** The recipient's card message as a handwritten gift tag. Customer text, so it wraps anywhere. */
function MessageTag({ message }: { message: string }): ReactElement {
  return (
    <figure className="bg-surface shadow-lift relative max-w-md min-w-0 -rotate-1 rounded-md py-5 pr-5 pl-12 motion-reduce:rotate-0">
      <span
        aria-hidden="true"
        className="bg-background shadow-hairline absolute top-1/2 left-4 size-4 -translate-y-1/2 rounded-full"
      />
      <blockquote className="font-script text-foreground text-3xl leading-snug font-bold wrap-anywhere whitespace-pre-line">
        {message}
      </blockquote>
    </figure>
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
        <h1 className="font-display mt-2 text-4xl leading-none font-bold tracking-tight wrap-anywhere sm:text-5xl">
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
