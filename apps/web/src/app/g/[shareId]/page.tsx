import { ShareIdSchema } from "@giftpop/contracts";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PlaceholderPage } from "@/components/placeholder-page";

type SharedGiftPageProps = { params: Promise<{ shareId: string }> };

export const metadata: Metadata = { title: "A shared gift" };

export default async function SharedGiftPage({ params }: SharedGiftPageProps) {
  const { shareId: rawShareId } = await params;
  const parsed = ShareIdSchema.safeParse(rawShareId);
  if (!parsed.success) notFound();

  return (
    <PlaceholderPage
      eyebrow={`Gift ${parsed.data}`}
      title="Someone made you a gift design"
      status="Shared gifts are coming soon"
    >
      <p>
        This page will show the gift full screen, with the buttons &ldquo;Order this gift&rdquo; and
        &ldquo;Make your own&rdquo;.
      </p>
    </PlaceholderPage>
  );
}
