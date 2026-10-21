"use client";

import type { CountryCode } from "@giftpop/contracts";
import type { ReactElement } from "react";

import { useGiftUnavailable } from "./gifts-freshness";
import { orderLabel } from "./gifts-model";
import { ShareGiftButton } from "./share-gift-button";

import { ButtonLink } from "@/components/ui";
import { builderHref } from "@/features/builder/state";

/**
 * The card's buttons: order and share, or, once the gift can no longer be made, a plain sentence
 * and a way on. Ordering opens the builder pre-filled; the builder itself notes that the gift began
 * ready-made.
 */
export function GiftActions({
  country,
  id,
  title,
  description,
  shareId,
}: {
  country: CountryCode;
  id: string;
  title: string;
  description: string;
  shareId: string;
}): ReactElement {
  const unavailable = useGiftUnavailable(id);
  // One live region for both states, so a screen reader announces the swap when the page finds out.
  return (
    <div aria-live="polite" className="flex flex-col gap-2">
      {unavailable ? (
        <>
          <p className="text-sm font-semibold">
            This gift is not available right now. You can still build your own.
          </p>
          <ButtonLink href={builderHref(country)} variant="tint" block>
            Build your own gift
          </ButtonLink>
        </>
      ) : (
        <>
          <ButtonLink
            href={builderHref(country, shareId)}
            // Starts with the visible text so voice control matches it.
            aria-label={orderLabel(title)}
            block
          >
            Order this gift
          </ButtonLink>
          <ShareGiftButton title={title} description={description} shareId={shareId} />
        </>
      )}
    </div>
  );
}
