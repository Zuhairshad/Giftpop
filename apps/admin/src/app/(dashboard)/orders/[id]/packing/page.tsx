import type { Metadata } from "next";

import { PackingSheet } from "@/features/orders/packing";

export const metadata: Metadata = { title: "Packing sheet" };

type PackingPageProps = { params: Promise<{ id: string }> };

export default async function PackingPage({ params }: PackingPageProps) {
  return <PackingSheet id={(await params).id} />;
}
