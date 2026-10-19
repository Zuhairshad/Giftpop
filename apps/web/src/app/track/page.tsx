import type { Metadata } from "next";

import { TrackScreen } from "@/features/track";

export const metadata: Metadata = { title: "Track an order", robots: { index: false } };

export default function TrackPage() {
  return <TrackScreen />;
}
