import { PublicCountrySchema } from "@giftpop/contracts";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { z } from "zod";

import { apiRequest } from "@/lib/api";
import { parseCountryParam } from "@/lib/country-param";

type CountryLayoutProps = { children: ReactNode; params: Promise<{ country: string }> };

/** Unknown country codes are a 404; countries that are not live yet go to the country list. */
export default async function CountryLayout({ children, params }: CountryLayoutProps) {
  const code = parseCountryParam((await params).country);
  if (!code) notFound();

  let countries: z.infer<typeof PublicCountrySchema>[] | null;
  try {
    countries = await apiRequest("/countries", z.array(PublicCountrySchema), { cache: "no-store" });
  } catch {
    // The API is down: the home page still shows its static sections, and the builder
    // has its own error page. Do not turn an outage into a blank 500 here.
    countries = null;
  }
  if (countries) {
    const country = countries.find((candidate) => candidate.code === code);
    if (!country) notFound();
    if (country.status !== "live") redirect("/countries");
  }

  return children;
}
