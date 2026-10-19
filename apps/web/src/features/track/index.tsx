import { Suspense } from "react";
import type { ReactElement } from "react";

import { TrackClient } from "./track-client";

/** `useSearchParams` needs a Suspense boundary so the page can still be prerendered. */
export function TrackScreen(): ReactElement {
  return (
    <Suspense fallback={<p className="text-muted py-6">Loading…</p>}>
      <TrackClient />
    </Suspense>
  );
}
