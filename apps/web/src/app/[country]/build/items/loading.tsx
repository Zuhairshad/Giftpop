"use client";

import { useParams } from "next/navigation";

import { ItemsSkeleton } from "@/features/builder/steps/items/items-skeleton";
import { parseCountryParam } from "@/lib/country-param";

/** Holds the items grid's space while the step loads, so the footer does not jump. */
export default function ItemsLoading() {
  const params = useParams<{ country: string }>();
  const country = parseCountryParam(params.country ?? "");
  return country ? <ItemsSkeleton country={country} /> : null;
}
