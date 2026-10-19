import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { fetchSharedDesign } from "@/features/share/fetch-shared-design";
import { buildShareMetadata, NOT_FOUND_METADATA } from "@/features/share/gift-metadata";
import { SharedGiftScreen } from "@/features/share/shared-gift-screen";

type SharedGiftPageProps = { params: Promise<{ shareId: string }> };

export async function generateMetadata({ params }: SharedGiftPageProps): Promise<Metadata> {
  const view = await fetchSharedDesign((await params).shareId);
  return view ? buildShareMetadata(view) : NOT_FOUND_METADATA;
}

export default async function SharedGiftPage({ params }: SharedGiftPageProps) {
  const view = await fetchSharedDesign((await params).shareId);
  if (!view) notFound();
  return <SharedGiftScreen view={view} />;
}
