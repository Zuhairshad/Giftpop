import { CatalogResponseSchema } from "@giftpop/contracts";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { BuilderProvider } from "@/features/builder/state";
import { apiRequest } from "@/lib/api";
import { parseCountryParam } from "@/lib/country-param";

type BuildLayoutProps = { children: ReactNode; params: Promise<{ country: string }> };

/**
 * Loads the country's catalog once and keeps the builder store above the page, so the store (and
 * the visitor's answers) survives the page re-rendering when `?from=` is removed from the address.
 */
export default async function BuildLayout({ children, params }: BuildLayoutProps) {
  const country = parseCountryParam((await params).country);
  if (!country) notFound();

  const catalog = await apiRequest(`/catalog?country=${country}`, CatalogResponseSchema, {
    cache: "no-store",
  });
  return (
    <BuilderProvider country={country} catalog={catalog}>
      {children}
    </BuilderProvider>
  );
}
