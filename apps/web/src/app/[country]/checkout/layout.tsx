import { CatalogResponseSchema } from "@giftpop/contracts";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { BuilderProvider } from "@/features/builder/state";
import { apiRequest } from "@/lib/api";
import { parseCountryParam } from "@/lib/country-param";

type CheckoutLayoutProps = { children: ReactNode; params: Promise<{ country: string }> };

/** Checkout reads the finished gift from the same builder store, so it loads the catalog too. */
export default async function CheckoutLayout({ children, params }: CheckoutLayoutProps) {
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
