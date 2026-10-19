import type { Metadata } from "next";

import { CountryPartnerForm } from "@/features/partners";

export const metadata: Metadata = { title: "Bring The Giftpop to your country" };

export default function CountryPartnerPage() {
  return <CountryPartnerForm />;
}
