import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { QuestionDataProvider } from "@/features/builder/questions/data-context";
import { BuilderShell } from "@/features/builder/shell";
import { fetchCountry, fetchTemplates } from "@/features/home/fetch-home-data";
import { templateCards } from "@/features/home/view-models";
import { parseCountryParam } from "@/lib/country-param";

export const metadata: Metadata = { title: "Build your gift" };

type BuildPageProps = {
  params: Promise<{ country: string }>;
  searchParams: Promise<{ from?: string | string[] }>;
};

/** The whole builder: the live gift and one question at a time. `?from=<shareId>` opens a saved gift or template. */
export default async function BuildPage({ params, searchParams }: BuildPageProps) {
  const country = parseCountryParam((await params).country);
  if (!country) notFound();
  const { from } = await searchParams;

  // Templates and the country name are extras: if either fails, the builder still works.
  const [templates, countryDoc] = await Promise.all([
    fetchTemplates(country),
    fetchCountry(country),
  ]);

  return (
    <QuestionDataProvider
      value={{
        country,
        countryName: countryDoc?.name ?? country,
        templates: templateCards(templates ?? [], country),
      }}
    >
      <BuilderShell from={Array.isArray(from) ? (from[0] ?? null) : (from ?? null)} />
    </QuestionDataProvider>
  );
}
