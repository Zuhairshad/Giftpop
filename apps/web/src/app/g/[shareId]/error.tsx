"use client";

import { StatePanel } from "@/components/placeholder-page";
import { Button, ButtonLink } from "@/components/ui";

/** Shown when the API is down or answers something unexpected. A missing gift is a 404 instead. */
export default function SharedGiftError({ reset }: { error: Error; reset: () => void }) {
  return (
    <StatePanel
      headingId="shared-gift-error-heading"
      script="Something slipped"
      title="We could not open this gift"
      actions={
        <>
          <Button onClick={reset}>Try again</Button>
          <ButtonLink href="/" variant="ghost">
            Go to the home page
          </ButtonLink>
        </>
      }
    >
      Something went wrong on our side. Try again in a moment.
    </StatePanel>
  );
}
