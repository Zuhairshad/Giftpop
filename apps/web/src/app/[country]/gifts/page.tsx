import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { GiftsScreen } from "@/features/gifts";
import { parseCountryParam } from "@/lib/country-param";

export const metadata: Metadata = {
  title: "Ready-made gifts",
  description: "Finished gifts made and sent by hand. Pick one, add your card message, and order.",
};

type GiftsPageProps = {
  params: Promise<{ country: string }>;
  searchParams: Promise<{ category?: string | string[] }>;
};

export default async function GiftsPage({ params, searchParams }: GiftsPageProps) {
  const code = parseCountryParam((await params).country);
  if (!code) notFound();
  const { category } = await searchParams;
  return <GiftsScreen country={code} category={category} />;
}
