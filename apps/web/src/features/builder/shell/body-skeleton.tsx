import type { ReactElement } from "react";

import { Skeleton } from "@/components/ui";

/**
 * Stands in for a question body while its chunk loads (bodies are normally preloaded, so this is
 * rare). About as tall as a short body, so the sheet does not jump when the answers arrive.
 */
export function BodySkeleton(): ReactElement {
  return (
    <div role="status" className="min-h-40 space-y-3 py-1">
      <span className="sr-only">Loading the question</span>
      <Skeleton className="h-4 w-3/5" />
      <div className="grid grid-cols-3 gap-2.5">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
      <Skeleton className="h-11 w-2/5" />
    </div>
  );
}
