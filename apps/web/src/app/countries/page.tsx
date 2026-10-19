import type { Metadata } from "next";

import { CountriesScreen } from "@/features/country";

export const metadata: Metadata = { title: "Choose your country" };

export default function CountriesPage() {
  return <CountriesScreen />;
}
