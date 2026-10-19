import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";
import { TemplatesManager } from "@/features/templates";

export const metadata: Metadata = { title: "Templates" };

export default function TemplatesPage() {
  return (
    <>
      <PageHeader title="Templates" />
      <div className="p-4 md:p-6">
        <TemplatesManager />
      </div>
    </>
  );
}
