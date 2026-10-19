import type { Metadata } from "next";

import { CountryPartnerForm } from "@/features/partners";

export const metadata: Metadata = { title: "Bring The Giftpop to your country" };

export default async function CountryPartnerPage({
  searchParams,
}: {
  searchParams: Promise<{ country?: string | string[] }>;
}) {
  const { country } = await searchParams;
  return <CountryPartnerForm country={country} />;
}
