"use client";

import type { ReactElement } from "react";

import { useBuilder } from "../../state";
import { reviewReady } from "../can-continue";
import { missingDetailsReason } from "../continue-reason";
import { reviewActionLabel } from "../packaging/ready-made-origin";

import { useReadyMadeOrigin } from "./use-ready-made-origin";

import { Button, ButtonLink } from "@/components/ui";
import { checkoutHref } from "@/features/share/links";

/** Ids of the review body's problem list and hint, which explain why checkout is blocked. */
export const REVIEW_PROBLEMS_ID = "review-problems";
export const REVIEW_BLOCKED_HINT_ID = "review-blocked-hint";

/**
 * The review question's primary action, drawn in the shell footer so it is always on screen:
 * a link to checkout, or (while the gift has problems) a button that says why it is blocked.
 * It reads "Order this gift" when the customer began from a ready-made gift, otherwise "Continue to
 * checkout"; the behaviour is the same either way.
 */
export function ReviewCheckoutAction({
  className,
  reasonId,
}: {
  className?: string;
  reasonId?: string;
}): ReactElement {
  const builder = useBuilder();
  const label = reviewActionLabel(useReadyMadeOrigin(builder.country) !== null);
  if (reviewReady(builder) && missingDetailsReason(builder) !== null) {
    return (
      <Button size="md" className={className} onClick={() => builder.goToQuestion("personalise")}>
        Add the missing details
      </Button>
    );
  }
  if (reviewReady(builder)) {
    return (
      <ButtonLink href={checkoutHref(builder.country)} size="md" className={className}>
        {label}
      </ButtonLink>
    );
  }
  const describedBy = [reasonId ?? ""];
  if (builder.design !== null) describedBy.push(REVIEW_PROBLEMS_ID, REVIEW_BLOCKED_HINT_ID);
  const describedByText = describedBy.filter((id) => id !== "").join(" ");
  return (
    <Button
      size="md"
      aria-disabled="true"
      aria-describedby={describedByText === "" ? undefined : describedByText}
      className={className}
    >
      {label}
    </Button>
  );
}
