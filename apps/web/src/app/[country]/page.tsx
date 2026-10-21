import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { HomeScreen, countryDisplayName, homeMetadata, homeTicks } from "@/features/home";
import { fetchCountry } from "@/features/home/fetch-home-data";
import { countryPath } from "@/features/home/view-models";
import { parseCountryParam } from "@/lib/country-param";

type CountryHomeProps = { params: Promise<{ country: string }> };

export async function generateMetadata({ params }: CountryHomeProps): Promise<Metadata> {
  const code = parseCountryParam((await params).country);
  if (!code) return homeMetadata();
  return homeMetadata({ code, name: countryDisplayName(code, await fetchCountry(code)) });
}

/**
 * The home page for one country. `fetchCountry` never throws: when the API is down the code from
 * the URL stands in for the name and the data-driven ticks are dropped. Unknown codes are a 404.
 */
export default async function CountryHome({ params }: CountryHomeProps) {
  const code = parseCountryParam((await params).country);
  if (!code) notFound();
  const country = await fetchCountry(code);
  return <HomeScreen ticks={homeTicks(country)} buildHref={`${countryPath(code)}/build`} />;
}
