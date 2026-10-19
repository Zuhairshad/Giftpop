import { notFound } from "next/navigation";

import { HomeSections } from "@/features/home";
import { Hero } from "@/features/home/hero";
import { parseCountryParam } from "@/lib/country-param";

type CountryHomeProps = { params: Promise<{ country: string }> };

/** The home page for one country: its featured templates and formats. Unknown codes are a 404 (the layout checks the rest). */
export default async function CountryHome({ params }: CountryHomeProps) {
  const country = parseCountryParam((await params).country);
  if (!country) notFound();
  return (
    <div className="space-y-12">
      <Hero country={country} />
      <HomeSections country={country} />
    </div>
  );
}
