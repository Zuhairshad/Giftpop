import type { Metadata } from "next";

import { HomeScreen, homeMetadata, homeTicks } from "@/features/home";

export const metadata: Metadata = homeMetadata();

/** `/` with no country chosen. Returning visitors are redirected to `/<cc>` by `proxy.ts`. */
export default function Home() {
  return (
    <HomeScreen ticks={homeTicks(null)} buildHref="/countries" chooseCountryHref="/countries" />
  );
}
