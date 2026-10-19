import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata: Metadata = { title: "Catalog" };

export default function CatalogPage() {
  return (
    <PlaceholderPage
      title="Catalog"
      description="Items, packaging, per-country prices and stock, and images."
    />
  );
}
