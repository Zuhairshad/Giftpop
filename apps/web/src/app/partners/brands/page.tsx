import type { Metadata } from "next";

import { BrandPartnerForm } from "@/features/partners";

export const metadata: Metadata = { title: "Sell your products in Giftpop gifts" };

export default function BrandPartnerPage() {
  return <BrandPartnerForm />;
}
