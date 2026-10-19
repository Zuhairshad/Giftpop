"use client";

import { RouteError } from "@/features/catalog/components/route-error";

export default function DashboardError({ reset }: { error: Error; reset: () => void }) {
  return <RouteError what="this page" reset={reset} />;
}
