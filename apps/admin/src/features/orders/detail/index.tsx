import Link from "next/link";

import { CustomerSection } from "./customer-section";
import { GiftSection } from "./gift-section";
import { PaymentSection } from "./payment-section";
import { loadOrder } from "./server";
import { TimelineSection } from "./timeline-section";

import { OrderActions } from "@/features/orders/actions";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_STYLES,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_STYLES,
} from "@/features/orders/status";
import { flagEmoji, formatDateTime } from "@/lib/format";

/** Server Component. Re-reads the order on every refresh, so actions only need `router.refresh()`. */
export async function OrderDetail({ id }: { id: string }) {
  const order = await loadOrder(id);

  return (
    <div className="grid min-w-0 grid-cols-1 gap-4">
      <header className="grid gap-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h1 className="text-2xl font-bold tracking-tight wrap-anywhere sm:text-3xl">
            {order.number}
          </h1>
          <span
            className={`rounded-full px-2.5 py-0.5 text-sm font-medium ${ORDER_STATUS_STYLES[order.status]}`}
          >
            {ORDER_STATUS_LABELS[order.status]}
          </span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-sm font-medium ${PAYMENT_STATUS_STYLES[order.paymentStatus]}`}
          >
            {PAYMENT_STATUS_LABELS[order.paymentStatus]}
          </span>
        </div>
        <p className="text-muted-foreground text-sm">
          <span aria-hidden>{flagEmoji(order.country)} </span>
          {order.country}, placed {formatDateTime(order.createdAt)}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/orders/${order.id}/packing`}
            className="focus-visible:ring-ring/50 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted focus-visible:ring-[3px]"
          >
            Print packing sheet
          </Link>
          <OrderActions order={order} />
        </div>
      </header>

      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <div className="grid min-w-0 grid-cols-1 content-start gap-4">
          <GiftSection order={order} />
          <CustomerSection order={order} />
        </div>
        <div className="grid min-w-0 grid-cols-1 content-start gap-4">
          <PaymentSection order={order} />
          <TimelineSection order={order} />
        </div>
      </div>
    </div>
  );
}
