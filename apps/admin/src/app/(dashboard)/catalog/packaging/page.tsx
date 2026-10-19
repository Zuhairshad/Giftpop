import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { loadPackagings } from "@/features/catalog/api/server";
import { CatalogTabs } from "@/features/catalog/components/catalog-tabs";
import { PackagingTable } from "@/features/catalog/components/packaging-table";

export const metadata: Metadata = { title: "Packaging" };

export default async function PackagingPage() {
  const packagings = await loadPackagings();

  return (
    <>
      <PageHeader
        title="Packaging"
        description="Items, packaging, per-country prices and stock, and images."
        actions={
          <Link href="/catalog/packaging/new" className={buttonVariants()}>
            Add packaging
          </Link>
        }
      />
      <CatalogTabs current="packaging" />
      <div className="p-4 md:p-6">
        <PackagingTable packagings={packagings} />
      </div>
    </>
  );
}
