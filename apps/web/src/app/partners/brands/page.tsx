import type { Metadata } from "next";

import { BrandPartnerForm } from "@/features/partners";

export const metadata: Metadata = { title: "Sell your products in Giftpop gifts" };

// The country list comes from the API on every visit, so never prerender it at build time.
export const dynamic = "force-dynamic";

export default function BrandPartnerPage() {
  return <BrandPartnerForm />;
}
