"use client";

import type { ReactElement } from "react";

import { useBuilder } from "../state";

import { CardPanel } from "./review/card-panel";
import { cardSummary } from "./review/card-summary";
import { REVIEW_BLOCKED_HINT_ID, REVIEW_PROBLEMS_ID } from "./review/checkout-action";
import { PriceSection } from "./review/price-section";
import { SharePanel } from "./review/share-panel";

/**
 * Question 6 body: the card, the price for both payment modes from the API quote and "Save and
 * share". The way on to checkout is the shell footer's primary action (`ReviewCheckoutAction`),
 * so it never scrolls out of sight. The gift itself is in the overview.
 */
export function ReviewBody(): ReactElement {
  const builder = useBuilder();
  const { design, country, problems } = builder;

  if (!design) {
    return <p className="text-muted text-sm">Pick what your gift comes in first.</p>;
  }
  const blocked = problems.length > 0;
  const card = cardSummary(design.personalisation);

  return (
    <div className="space-y-5">
      {blocked ? (
        <div className="space-y-2">
          <div
            id={REVIEW_PROBLEMS_ID}
            role="alert"
            className="bg-warm space-y-1 rounded-md p-3 text-sm"
          >
            <p className="font-semibold">Fix this before you continue</p>
            <ul className="list-disc space-y-1 pl-5">
              {problems.map((problem) => (
                <li key={`${problem.code}-${problem.itemId ?? problem.field ?? ""}`}>
                  {problem.message}
                </li>
              ))}
            </ul>
          </div>
          <p id={REVIEW_BLOCKED_HINT_ID} className="text-muted text-sm">
            Checkout opens once the problems above are fixed. Go back to fix them.
          </p>
        </div>
      ) : null}

      {card ? <CardPanel card={card} /> : null}

      <PriceSection quote={builder.quote} status={builder.quoteStatus} />

      <SharePanel country={country} design={design} />
    </div>
  );
}
