"use client";

import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";

import { useBuilderStore } from "./context";
import { firstMissingStep, hasLoadParam } from "./guard";
import { useBuilder } from "./provider";
import { stepHref } from "./steps";
import type { BuilderStep } from "./types";

/**
 * Sends the visitor back to the first step whose prerequisites are missing.
 * Waits until saved state has been read, so a refresh does not bounce anyone.
 * Does nothing when the URL has `?from=...`: the review step loads that design first.
 */
export function useStepGuard(step: BuilderStep): void {
  const router = useRouter();
  const store = useBuilderStore();
  const { country, packaging, itemCount, problems } = useBuilder();
  const hydrated = useSyncExternalStore(store.subscribe, store.isHydrated, () => false);

  useEffect(() => {
    if (!hydrated) return;
    // Read from the address bar here, not with useSearchParams, so pages need no Suspense boundary.
    if (hasLoadParam(window.location.search)) return;
    const missing = firstMissingStep(step, { packaging, itemCount, problems });
    if (missing !== null) router.replace(stepHref(country, missing));
  }, [hydrated, step, country, packaging, itemCount, problems, router]);
}
