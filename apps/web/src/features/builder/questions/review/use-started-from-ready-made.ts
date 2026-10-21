"use client";

import type { CountryCode } from "@giftpop/contracts";
import { useSyncExternalStore } from "react";

import { startedFromReadyMade } from "../packaging/ready-made-origin";

const NEVER_CHANGES = (): (() => void) => () => undefined;

/**
 * True when this tab's gift began as a ready-made gift (see `ready-made-origin`). False on the
 * server and on the first client render, so the HTML always matches.
 */
export function useStartedFromReadyMade(country: CountryCode): boolean {
  return useSyncExternalStore(
    NEVER_CHANGES,
    () => startedFromReadyMade(country),
    () => false,
  );
}
