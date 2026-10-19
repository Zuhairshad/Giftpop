import type { Metadata } from "next";

import { ArrangeStep } from "@/features/builder/steps/arrange";

export const metadata: Metadata = { title: "Arrange your gift" };

export default function ArrangeStepPage() {
  return <ArrangeStep />;
}
