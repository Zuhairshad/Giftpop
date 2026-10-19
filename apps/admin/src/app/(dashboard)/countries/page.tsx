import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata: Metadata = { title: "Countries" };

export default function CountriesPage() {
  return (
    <PlaceholderPage
      title="Countries"
      description="Currency, shipping, payment modes and launch status for each country."
    />
  );
}
