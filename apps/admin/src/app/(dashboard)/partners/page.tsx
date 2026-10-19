import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata: Metadata = { title: "Partners" };

export default function PartnersPage() {
  return (
    <PlaceholderPage
      title="Partners"
      description="Partner requests from people who want The Giftpop in their country."
    />
  );
}
