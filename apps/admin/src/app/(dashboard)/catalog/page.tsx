import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { loadCategories, loadItems } from "@/features/catalog/api/server";
import { CatalogTabs } from "@/features/catalog/components/catalog-tabs";
import { ItemsFilters } from "@/features/catalog/components/items-filters";
import { ItemsTable } from "@/features/catalog/components/items-table";
import { parseItemsQuery } from "@/features/catalog/lib/items-query";

export const metadata: Metadata = { title: "Catalog" };

type SearchParams = Record<string, string | string[] | undefined>;

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const query = parseItemsQuery(await searchParams);
  const [result, categories] = await Promise.all([loadItems(query), loadCategories()]);
  const filters = { search: query.search, category: query.category, active: query.active };

  return (
    <>
      <PageHeader
        title="Catalog"
        description="Items, packaging, per-country prices and stock, and images."
        actions={
          <Link href="/catalog/items/new" className={buttonVariants()}>
            Add item
          </Link>
        }
      />
      <CatalogTabs current="items" />
      <div className="grid grid-cols-1 gap-4 p-4 md:p-6">
        <ItemsFilters categories={categories} current={filters} />
        <ItemsTable
          items={result.items}
          page={result.page}
          pageSize={result.pageSize}
          total={result.total}
          filters={filters}
        />
      </div>
    </>
  );
}
