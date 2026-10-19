"use client";

import type { ReactElement } from "react";

import { useBuilder } from "../../state";
import { reviewReady } from "../can-continue";

import { Button, ButtonLink } from "@/components/ui";
import { checkoutHref } from "@/features/share/links";

/** Ids of the review body's problem list and hint, which explain why checkout is blocked. */
export const REVIEW_PROBLEMS_ID = "review-problems";
export const REVIEW_BLOCKED_HINT_ID = "review-blocked-hint";

/**
 * The review question's primary action, drawn in the shell footer so it is always on screen:
 * a link to checkout, or (while the gift has problems) a button that says why it is blocked.
 */
export function ReviewCheckoutAction({ className }: { className?: string }): ReactElement {
  const builder = useBuilder();
  if (reviewReady(builder)) {
    return (
      <ButtonLink href={checkoutHref(builder.country)} size="md" className={className}>
        Continue to checkout
      </ButtonLink>
    );
  }
  const explained = builder.design !== null;
  return (
    <Button
      size="md"
      aria-disabled="true"
      aria-describedby={explained ? `${REVIEW_PROBLEMS_ID} ${REVIEW_BLOCKED_HINT_ID}` : undefined}
      className={className}
    >
      Continue to checkout
    </Button>
  );
}
