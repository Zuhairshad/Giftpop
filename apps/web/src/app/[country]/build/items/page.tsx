import type { Metadata } from "next";

import { ItemsStep } from "@/features/builder/steps/items";

export const metadata: Metadata = { title: "Pick your items" };

export default function ItemsStepPage() {
  return <ItemsStep />;
}
