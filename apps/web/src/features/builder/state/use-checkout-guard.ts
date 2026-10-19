"use client";

import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";

import { checkoutRedirect } from "./checkout-redirect";
import { useBuilderStore } from "./context";
import { useBuilder } from "./provider";

/**
 * Sends a visitor whose gift cannot be ordered yet back to the builder (`/<cc>/build`), which
 * reopens on the first question still missing. Waits until saved state has been read, so a refresh
 * does not bounce anyone.
 */
export function useCheckoutGuard(): void {
  const router = useRouter();
  const store = useBuilderStore();
  const { country, packaging, itemCount, problems } = useBuilder();
  const hydrated = useSyncExternalStore(store.subscribe, store.isHydrated, () => false);

  useEffect(() => {
    if (!hydrated) return;
    const href = checkoutRedirect(country, { packaging, itemCount, problems });
    if (href !== null) router.replace(href);
  }, [hydrated, country, packaging, itemCount, problems, router]);
}
