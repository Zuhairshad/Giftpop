"use client";

import type { ReactElement } from "react";

import { useBuilder } from "../state";

import { reviewReady } from "./can-continue";
import { PriceSection } from "./review/price-section";
import { SharePanel } from "./review/share-panel";

import { Button, ButtonLink } from "@/components/ui";
import { checkoutHref } from "@/features/share/links";

/**
 * Question 6 body (it draws its own actions): the price for both payment modes from the API
 * quote, "Save and share", and the way on to checkout. The gift itself is in the overview.
 */
export function ReviewBody(): ReactElement {
  const builder = useBuilder();
  const { design, country, problems } = builder;

  if (!design) {
    return <p className="text-muted text-sm">Pick what your gift comes in first.</p>;
  }
  const blocked = problems.length > 0;

  return (
    <div className="space-y-5">
      <PriceSection quote={builder.quote} status={builder.quoteStatus} />

      {blocked ? (
        <div id="review-problems" role="alert" className="bg-warm rounded-md space-y-1 p-3 text-sm">
          <p className="font-semibold">Fix this before you continue</p>
          <ul className="list-disc space-y-1 pl-5">
            {problems.map((problem) => (
              <li key={`${problem.code}-${problem.itemId ?? problem.field ?? ""}`}>
                {problem.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <SharePanel country={country} design={design} />

      <div className="space-y-2">
        {blocked ? (
          <>
            <Button
              size="lg"
              block
              aria-disabled="true"
              aria-describedby="review-problems review-blocked-hint"
              className="cursor-not-allowed opacity-50"
            >
              Continue to checkout
            </Button>
            <p id="review-blocked-hint" className="text-muted text-sm">
              Checkout opens once the problems above are fixed. Go back to fix them.
            </p>
          </>
        ) : (
          <ButtonLink href={checkoutHref(country)} size="lg" block>
            Continue to checkout
          </ButtonLink>
        )}
      </div>
    </div>
  );
}

/** The gift can be ordered. The body's own link does the going; this is for the shell. */
export function useReviewCanContinue(): boolean {
  return reviewReady(useBuilder());
}
