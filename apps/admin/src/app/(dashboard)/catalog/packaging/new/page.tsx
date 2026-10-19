import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";
import { loadCountries } from "@/features/catalog/api/server";
import { PackagingForm } from "@/features/catalog/components/packaging-form";

export const metadata: Metadata = { title: "New packaging" };

export default async function NewPackagingPage() {
  const countries = await loadCountries();

  return (
    <>
      <PageHeader
        title="New packaging"
        description="Add a format customers can pick, such as a bouquet or a box."
      />
      <div className="max-w-6xl p-4 md:p-6">
        <PackagingForm countries={countries} prices={[]} />
      </div>
    </>
  );
}
