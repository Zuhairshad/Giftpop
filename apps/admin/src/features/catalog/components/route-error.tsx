"use client";

import { Button } from "@/components/ui/button";

/** Shown when a catalog or country page could not load its data. The details stay in the server log. */
export function RouteError({ what, reset }: { what: string; reset: () => void }) {
  return (
    <div role="alert" className="grid max-w-md gap-3 p-4 md:p-6">
      <h2 className="text-lg font-semibold">{`Could not load ${what}`}</h2>
      <p className="text-muted-foreground text-sm">
        The server did not answer as expected. Check that the API is running, then try again.
      </p>
      <div>
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
