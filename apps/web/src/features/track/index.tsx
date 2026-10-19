import { Suspense } from "react";
import type { ReactElement } from "react";

import { TrackClient } from "./track-client";

import { StatePanel } from "@/features/order/state-panel";

/** `useSearchParams` needs a Suspense boundary so the page can still be prerendered. */
export function TrackScreen(): ReactElement {
  return (
    <Suspense fallback={<StatePanel tone="loading">Loading…</StatePanel>}>
      <TrackClient />
    </Suspense>
  );
}
