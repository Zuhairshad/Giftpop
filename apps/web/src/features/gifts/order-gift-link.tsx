"use client";

import type { CountryCode } from "@giftpop/contracts";
import type { ReactElement } from "react";

import { ButtonLink } from "@/components/ui";
import { markReadyMadeStart } from "@/features/builder/questions/packaging/ready-made-origin";

/**
 * The card's primary button. Leaves a note that the gift began ready-made, so the builder's review
 * step says "Order this gift", then opens the builder pre-filled.
 */
export function OrderGiftLink({
  country,
  href,
  label,
}: {
  country: CountryCode;
  href: string;
  label: string;
}): ReactElement {
  return (
    <ButtonLink
      href={href}
      onClick={() => markReadyMadeStart(country)}
      // Starts with the visible text so voice control matches it.
      aria-label={label}
      block
    >
      Order this gift
    </ButtonLink>
  );
}
