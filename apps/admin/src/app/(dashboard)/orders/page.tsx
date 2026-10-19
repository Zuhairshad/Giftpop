import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata: Metadata = { title: "Orders" };

export default function OrdersPage() {
  return (
    <PlaceholderPage
      title="Orders"
      description="Incoming orders, fulfilment and shipment statuses."
    />
  );
}
