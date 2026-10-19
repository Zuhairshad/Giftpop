import type { AdminOrderDetail } from "@giftpop/contracts";

import { RecordPayment } from "./components/payment-dialog";
import { StatusMenu } from "./components/status-menu";

export { ProofReview } from "./components/proof-review";

/**
 * The staff actions for one order: change status and record payment. The detail page
 * renders this one component; each action calls `router.refresh()` so the page re-reads.
 */
export function OrderActions({ order }: { order: AdminOrderDetail }) {
  return (
    <div className="flex flex-wrap items-start gap-3">
      <StatusMenu order={order} />
      <RecordPayment order={order} />
    </div>
  );
}
