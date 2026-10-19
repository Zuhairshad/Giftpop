import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";
import { DashboardScreen } from "@/features/dashboard";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <>
      <PageHeader title="Dashboard" description="What needs action now." />
      <div className="p-4 md:p-6">
        <DashboardScreen />
      </div>
    </>
  );
}
