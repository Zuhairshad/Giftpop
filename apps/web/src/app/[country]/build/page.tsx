import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PlaceholderPage } from "@/components/placeholder-page";
import { parseCountryParam } from "@/lib/country-param";

type BuildPageProps = { params: Promise<{ country: string }> };

export const metadata: Metadata = { title: "Build your gift" };

export default async function BuildPage({ params }: BuildPageProps) {
  const { country: rawCountry } = await params;
  const country = parseCountryParam(rawCountry);
  if (!country) notFound();

  return (
    <PlaceholderPage
      eyebrow={`Shipping to ${country}`}
      title="Build your gift"
      status="The gift builder is coming soon"
    >
      <p>
        You will pick a format, choose items, arrange them, add a personal note and review the price
        here, one step at a time.
      </p>
    </PlaceholderPage>
  );
}
