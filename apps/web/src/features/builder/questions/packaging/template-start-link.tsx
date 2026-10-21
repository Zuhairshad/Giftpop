import type { CountryCode } from "@giftpop/contracts";
import Link from "next/link";
import type { ReactElement } from "react";

import { templateLinkLabel, templateStartHref } from "./template-href";

/**
 * "Start from this" for one template: opens the builder pre-filled. The builder notes that the gift
 * began ready-made when it loads it (see `ready-made-origin`).
 */
export function TemplateStartLink({
  country,
  cardHref,
  title,
}: {
  country: CountryCode;
  cardHref: string;
  title: string;
}): ReactElement {
  return (
    <Link
      href={templateStartHref(country, cardHref)}
      // Starts with the visible text so voice control matches it; an sr-only span would
      // make Chrome add a space ("Start from this : ...").
      aria-label={templateLinkLabel(title)}
      className="text-pink-strong mt-auto inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4"
    >
      Start from this
    </Link>
  );
}
