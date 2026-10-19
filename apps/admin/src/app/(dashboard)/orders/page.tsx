import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";
import { OrdersList } from "@/features/orders/list";

export const metadata: Metadata = { title: "Orders" };

export default function OrdersPage() {
  return (
    <>
      <PageHeader title="Orders" />
      <div className="p-4 md:p-6">
        <OrdersList />
      </div>
    </>
  );
}
