"use client";

import { SharedDesignViewSchema } from "@giftpop/contracts";
import type { CountryCode, ShareId, SharedDesignView } from "@giftpop/contracts";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useEffectEvent, useState } from "react";
import type { ReactElement } from "react";

import {
  clearReadyMadeStart,
  rememberReadyMade,
} from "../../questions/packaging/ready-made-origin";
import { builderHref, useBuilder } from "../../state";

import { describeFromError, unavailableItemNames } from "./from-param";

import { apiRequest } from "@/lib/api";

type FromLoaderProps = {
  country: CountryCode;
  /** A valid share id, or null when `?from=` was present but malformed. */
  shareId: ShareId | null;
  invalidMessage: string;
  /** Called with the names of items that could not come along, before the param is removed. */
  onLoaded: (unavailableNames: string[]) => void;
};

/**
 * Loads a shared design into the builder, then drops `?from=` from the URL so the
 * step guard takes over. Shows its own loading and error states.
 */
export function FromLoader({
  country,
  shareId,
  invalidMessage,
  onLoaded,
}: FromLoaderProps): ReactElement {
  const { loadDesign } = useBuilder();
  const router = useRouter();
  const [error, setError] = useState<string | null>(shareId ? null : invalidMessage);

  // An effect event always sees the latest store and callback without re-running the fetch.
  const onFetched = useEffectEvent((view: SharedDesignView) => {
    loadDesign(view.design);
    // Leave a note of which ready-made gift this is, so the review step can name it and tell the
    // customer whether they changed it. Any other shared design clears an older note.
    if (view.readyMade) {
      rememberReadyMade(country, {
        shareId: view.shareId,
        title: view.readyMade.title,
        design: view.design,
      });
    } else {
      clearReadyMadeStart(country);
    }
    onLoaded(unavailableItemNames(view));
    router.replace(builderHref(country));
  });

  useEffect(() => {
    if (!shareId) return;
    const controller = new AbortController();
    // Availability is worked out for the country the visitor is in, not the one the gift was saved in.
    apiRequest(`/designs/${shareId}?country=${country}`, SharedDesignViewSchema, {
      signal: controller.signal,
    })
      .then((view) => {
        if (controller.signal.aborted) return;
        onFetched(view);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setError(describeFromError(cause));
      });
    return () => controller.abort();
  }, [shareId, country]);

  if (error) {
    return (
      <section className="py-10 text-center" aria-labelledby="from-error-heading">
        <h1 id="from-error-heading" className="font-display text-3xl font-bold">
          We could not open that gift
        </h1>
        <p role="alert" className="text-muted mt-3">
          {error}
        </p>
        <Link
          href={builderHref(country)}
          className="bg-pink text-on-pink hover:bg-pink-strong mt-6 inline-block rounded-full px-6 py-2.5 font-bold transition-colors"
        >
          Start from scratch
        </Link>
      </section>
    );
  }

  return (
    <section className="py-10 text-center" aria-busy="true">
      <h1 className="font-display text-3xl font-bold">Opening your gift</h1>
      <p role="status" className="text-muted mt-3">
        Loading the gift you chose&hellip;
      </p>
    </section>
  );
}
