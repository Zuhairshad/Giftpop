import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";
import { loadCountries, loadViewerRole } from "@/features/catalog/api/server";
import { CountriesTable } from "@/features/catalog/components/countries-table";

export const metadata: Metadata = { title: "Countries" };

export default async function CountriesPage() {
  const [countries, role] = await Promise.all([loadCountries(), loadViewerRole()]);

  return (
    <>
      <PageHeader
        title="Countries"
        description="Currency, shipping, payment modes and launch status for each country."
      />
      <div className="p-4 md:p-6">
        <CountriesTable countries={countries} canEdit={role !== "staff"} />
      </div>
    </>
  );
}
