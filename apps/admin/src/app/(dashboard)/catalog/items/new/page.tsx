import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";
import { loadCategories, loadCountries } from "@/features/catalog/api/server";
import { ItemForm } from "@/features/catalog/components/item-form";

export const metadata: Metadata = { title: "New item" };

export default async function NewItemPage() {
  const [countries, categories] = await Promise.all([loadCountries(), loadCategories()]);

  return (
    <>
      <PageHeader title="New item" description="Add an item customers can put in a gift." />
      <div className="max-w-5xl p-4 md:p-6">
        <ItemForm countries={countries} prices={[]} categories={categories} />
      </div>
    </>
  );
}
