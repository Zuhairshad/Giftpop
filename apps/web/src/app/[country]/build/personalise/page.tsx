import type { Metadata } from "next";

import { PersonaliseStep } from "@/features/builder/steps/personalise";

export const metadata: Metadata = { title: "Make it personal" };

export default function PersonaliseStepPage() {
  return <PersonaliseStep />;
}
