import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";
import { loadCountries } from "@/features/catalog/api/server";
import { CountriesTable } from "@/features/catalog/components/countries-table";
import { requireOwner } from "@/lib/session";

export const metadata: Metadata = { title: "Countries" };

export default async function CountriesPage() {
  // Owner only. A layout does not re-run on client navigation, so each page checks itself.
  await requireOwner();
  const countries = await loadCountries();

  return (
    <>
      <PageHeader
        title="Countries"
        description="Currency, shipping, payment modes and launch status for each country."
      />
      <div className="p-4 md:p-6">
        <CountriesTable countries={countries} />
      </div>
    </>
  );
}
