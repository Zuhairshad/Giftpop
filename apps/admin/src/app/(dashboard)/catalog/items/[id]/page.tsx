import { ObjectIdSchema } from "@giftpop/contracts";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import {
  loadCategories,
  loadCountries,
  loadItem,
  loadItemPrices,
} from "@/features/catalog/api/server";
import { ItemForm } from "@/features/catalog/components/item-form";

export const metadata: Metadata = { title: "Edit item" };

export default async function EditItemPage({ params }: { params: Promise<{ id: string }> }) {
  const parsedId = ObjectIdSchema.safeParse((await params).id);
  if (!parsedId.success) notFound();
  const id = parsedId.data;

  const [item, prices, countries, categories] = await Promise.all([
    loadItem(id),
    loadItemPrices(id),
    loadCountries(),
    loadCategories(),
  ]);

  return (
    <>
      <PageHeader title={item.name} description="Edit this item, its image and its prices." />
      <div className="max-w-5xl p-4 md:p-6">
        <ItemForm
          item={item}
          countries={countries}
          prices={prices.prices}
          categories={categories}
        />
      </div>
    </>
  );
}
