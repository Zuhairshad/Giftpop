"use client";

import { StatePanel } from "@/components/placeholder-page";
import { Button, ButtonLink } from "@/components/ui";

/** Shown when something under a country page fails to load, for example the builder when the API is down. */
export default function CountryError({ reset }: { error: Error; reset: () => void }) {
  return (
    <StatePanel
      headingId="country-error-heading"
      script="Something slipped"
      title="We could not load this page"
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
