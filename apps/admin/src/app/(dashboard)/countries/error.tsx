"use client";

import { RouteError } from "@/features/catalog/components/route-error";

export default function CountriesError({ reset }: { error: Error; reset: () => void }) {
  return <RouteError what="countries" reset={reset} />;
}
