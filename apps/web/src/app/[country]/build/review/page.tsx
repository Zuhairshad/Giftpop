import type { Metadata } from "next";

import { ReviewStep } from "@/features/builder/steps/review";

export const metadata: Metadata = { title: "Review your gift" };

export default function ReviewStepPage() {
  return <ReviewStep />;
}
