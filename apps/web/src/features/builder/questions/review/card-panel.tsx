import type { ReactElement } from "react";

import type { CardSummary } from "./card-summary";

/** The customer's own words, shown back before they order. Customer text never stretches the page. */
export function CardPanel({ card }: { card: CardSummary }): ReactElement {
  return (
    <section aria-labelledby="review-card-heading" className="bg-warm rounded-md space-y-1 p-3">
      <h3 id="review-card-heading" className="text-sm font-semibold">
        Your card
      </h3>
      {card.recipient ? (
        <p className="text-sm wrap-anywhere">
          <span className="text-muted">For </span>
          {card.recipient}
        </p>
      ) : null}
      {card.message ? (
        <p className="font-script text-xl leading-snug wrap-anywhere">{card.message}</p>
      ) : null}
    </section>
  );
}
