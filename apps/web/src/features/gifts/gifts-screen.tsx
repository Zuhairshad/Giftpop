import type { CountryCode } from "@giftpop/contracts";
import type { ReactElement } from "react";

/** Stub from phase 8 step A: the `web-gifts-page` agent replaces this with the catalog. */
export function GiftsScreen({
  country,
}: {
  country: CountryCode;
  category?: string;
}): ReactElement {
  return (
    <main className="gp-bar py-8">
      <h1 className="text-2xl font-semibold">Ready-made gifts for {country}</h1>
    </main>
  );
}
