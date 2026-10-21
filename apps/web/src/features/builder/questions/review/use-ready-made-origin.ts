"use client";

import type { CountryCode } from "@giftpop/contracts";
import { useMemo, useSyncExternalStore } from "react";

import {
  parseReadyMadeOrigin,
  readyMadeOriginText,
  type ReadyMadeOrigin,
} from "../packaging/ready-made-origin";

const NEVER_CHANGES = (): (() => void) => () => undefined;

/**
 * The ready-made gift this tab's design began as, or null (see `ready-made-origin`). Null on the
 * server and on the first client render, so the HTML always matches.
 */
export function useReadyMadeOrigin(country: CountryCode): ReadyMadeOrigin | null {
  const text = useSyncExternalStore(
    NEVER_CHANGES,
    () => readyMadeOriginText(country),
    () => null,
  );
  return useMemo(() => parseReadyMadeOrigin(text), [text]);
}
