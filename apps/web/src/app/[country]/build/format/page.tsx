import type { Metadata } from "next";

import { FormatStep } from "@/features/builder/steps/format";

export const metadata: Metadata = { title: "Choose a format" };

export default function FormatStepPage() {
  return <FormatStep />;
}
