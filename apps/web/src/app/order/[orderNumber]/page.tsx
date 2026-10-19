import { OrderNumberSchema } from "@giftpop/contracts";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { OrderScreen } from "@/features/order";

export const metadata: Metadata = { title: "Your order", robots: { index: false } };

type OrderPageProps = { params: Promise<{ orderNumber: string }> };

export default async function OrderPage({ params }: OrderPageProps) {
  const parsed = OrderNumberSchema.safeParse((await params).orderNumber.toUpperCase());
  if (!parsed.success) notFound();
  return <OrderScreen orderNumber={parsed.data} />;
}
