import { ObjectIdSchema } from "@giftpop/contracts";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { loadCountries, loadPackaging, loadPackagingPrices } from "@/features/catalog/api/server";
import { PackagingForm } from "@/features/catalog/components/packaging-form";

export const metadata: Metadata = { title: "Edit packaging" };

export default async function EditPackagingPage({ params }: { params: Promise<{ id: string }> }) {
  const parsedId = ObjectIdSchema.safeParse((await params).id);
  if (!parsedId.success) notFound();
  const id = parsedId.data;

  const [packaging, prices, countries] = await Promise.all([
    loadPackaging(id),
    loadPackagingPrices(id),
    loadCountries(),
  ]);

  return (
    <>
      <PageHeader
        title={packaging.name}
        description="Edit this packaging, its layers and its prices."
      />
      <div className="max-w-6xl p-4 md:p-6">
        <PackagingForm packaging={packaging} countries={countries} prices={prices.prices} />
      </div>
    </>
  );
}
