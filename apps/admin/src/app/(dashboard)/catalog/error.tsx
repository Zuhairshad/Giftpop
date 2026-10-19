"use client";

import { RouteError } from "@/features/catalog/components/route-error";

export default function CatalogError({ reset }: { error: Error; reset: () => void }) {
  return <RouteError what="the catalog" reset={reset} />;
}
