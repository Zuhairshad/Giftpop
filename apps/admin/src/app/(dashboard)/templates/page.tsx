import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";
import { TemplatesManager } from "@/features/templates";
import { getWebOrigin } from "@/lib/env";

export const metadata: Metadata = { title: "Templates" };

export default function TemplatesPage() {
  return (
    <>
      <PageHeader title="Templates" />
      <div className="p-4 md:p-6">
        <TemplatesManager builderUrl={getWebOrigin()} />
      </div>
    </>
  );
}
