import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata: Metadata = { title: "Templates" };

export default function TemplatesPage() {
  return (
    <PlaceholderPage title="Templates" description="Featured gift templates shown on the store." />
  );
}
