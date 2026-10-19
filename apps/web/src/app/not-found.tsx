import type { Metadata } from "next";

import { StatePanel } from "@/components/placeholder-page";
import { ButtonLink } from "@/components/ui";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <StatePanel
      headingId="not-found-heading"
      script="Oh no"
      title="We could not find that page"
      actions={
        <>
          <ButtonLink href="/">Go to the home page</ButtonLink>
          <ButtonLink href="/countries" variant="tint">
            Choose your country
          </ButtonLink>
        </>
      }
    >
      The link may be wrong, or the page may have moved.
    </StatePanel>
  );
}
