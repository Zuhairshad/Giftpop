"use client";

import type { CountryCode } from "@giftpop/contracts";
import Link from "next/link";
import type { ReactElement } from "react";

import { markReadyMadeStart } from "./ready-made-origin";
import { templateLinkLabel, templateStartHref } from "./template-href";

/**
 * "Start from this" for one template. Leaves a note that the gift began ready-made (the review
 * step then says "Order this gift") and opens the builder pre-filled.
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
      onClick={() => markReadyMadeStart(country)}
      // Starts with the visible text so voice control matches it; an sr-only span would
      // make Chrome add a space ("Start from this : ...").
      aria-label={templateLinkLabel(title)}
      className="text-pink-strong mt-auto inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4"
    >
      Start from this
    </Link>
  );
}
