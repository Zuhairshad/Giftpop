import type { AdminOrderDetail } from "@giftpop/contracts";

/**
 * STUB. Replaced by the `admin-order-actions` slice in phase 4: change status, record
 * payment, with dialogs. The detail page renders this one component and refreshes itself
 * after any action (the actions call `router.refresh()`).
 */
export function OrderActions(_props: { order: AdminOrderDetail }) {
  return null;
}

/**
 * STUB. Accept / reject buttons for one payment proof, rendered by the detail page next to
 * each proof. Calls `PATCH /admin/orders/:id/proofs/:proofId` and then `router.refresh()`.
 */
export function ProofReview(_props: {
  orderId: string;
  proofId: string;
  status: "pending" | "accepted" | "rejected";
}) {
  return null;
}
