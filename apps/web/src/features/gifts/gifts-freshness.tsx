"use client";

import { PublicTemplateSchema } from "@giftpop/contracts";
import type { CountryCode, PublicTemplate } from "@giftpop/contracts";
import { createContext, useContext, useEffect, useState } from "react";
import type { ReactElement, ReactNode } from "react";
import { z } from "zod";

import { unavailableIds } from "./gifts-model";

import { apiRequest } from "@/lib/api";

const NONE: ReadonlySet<string> = new Set();
const Unavailable = createContext<ReadonlySet<string>>(NONE);

const ListSchema = z.array(z.unknown());

/**
 * The page's list is cached for up to 5 minutes, so an item can sell out after it was drawn. Once
 * the page is on screen this asks the API for the list again and marks the gifts it no longer
 * returns. If that request fails, nothing changes: the cards stay as drawn, and the order API
 * (422 `DESIGN_INVALID`) remains the final authority.
 */
export function GiftsFreshness({
  country,
  shown,
  children,
}: {
  country: CountryCode;
  shown: readonly Pick<PublicTemplate, "id">[];
  children: ReactNode;
}): ReactElement {
  const [unavailable, setUnavailable] = useState<ReadonlySet<string>>(NONE);
  // A string, so the effect re-runs when the gifts on the page change, not on every new array.
  const shownKey = shown.map((template) => template.id).join(",");

  useEffect(() => {
    const controller = new AbortController();
    apiRequest(`/templates?country=${encodeURIComponent(country)}`, ListSchema, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((entries) => {
        if (controller.signal.aborted) return;
        const fresh = entries.flatMap((entry) => {
          const parsed = PublicTemplateSchema.safeParse(entry);
          return parsed.success ? [parsed.data] : [];
        });
        setUnavailable(new Set(unavailableIds(
            shownKey.split(",").map((id) => ({ id })),
            fresh,
          )));
      })
      .catch(() => {
        // Keep the cards as drawn.
      });
    return () => controller.abort();
  }, [country, shownKey]);

  return <Unavailable value={unavailable}>{children}</Unavailable>;
}

/** True when the fresh list no longer has this gift. */
export function useGiftUnavailable(id: string): boolean {
  return useContext(Unavailable).has(id);
}
