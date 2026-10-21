import type { Metadata } from "next";

import { OrderDetail } from "@/features/orders/detail";

export const metadata: Metadata = { title: "Order" };

type OrderPageProps = { params: Promise<{ id: string }> };

export default async function OrderPage({ params }: OrderPageProps) {
  return (
    <div className="p-4 md:p-6">
      <OrderDetail id={(await params).id} />
    </div>
  );
}
