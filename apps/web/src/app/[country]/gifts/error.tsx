"use client";

import { StatePanel } from "@/components/placeholder-page";
import { Button, ButtonLink } from "@/components/ui";

/** Shown when the ready-made gifts page throws, so a failure never becomes a blank screen. */
export default function GiftsError({ reset }: { error: Error; reset: () => void }) {
  return (
    <StatePanel
      headingId="gifts-error-heading"
      script="Something slipped"
      title="We could not load the gifts"
      role="alert"
      actions={
        <>
          <Button onClick={reset}>Try again</Button>
          <ButtonLink href="/" variant="ghost">
            Go to the home page
          </ButtonLink>
        </>
      }
    >
      Something went wrong on our side. Nothing was lost. Try again in a moment.
    </StatePanel>
  );
}
