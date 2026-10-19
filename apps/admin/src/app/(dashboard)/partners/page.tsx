import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";
import { PartnersInbox } from "@/features/partners";

export const metadata: Metadata = { title: "Partners" };

export default function PartnersPage() {
  return (
    <>
      <PageHeader title="Partners" />
      <div className="p-4 md:p-6">
        <PartnersInbox />
      </div>
    </>
  );
}
