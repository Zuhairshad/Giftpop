import { AdminOrderDetailSchema } from "@giftpop/contracts";
import type {
  AdminOrderDetail,
  RecordPaymentRequest,
  ReviewProofRequest,
  StatusChangeRequest,
} from "@giftpop/contracts";

import { apiFetch } from "@/lib/api";

/** Browser-side calls for the order actions. Each returns the updated order. */

export function changeOrderStatus(
  orderId: string,
  body: StatusChangeRequest,
): Promise<AdminOrderDetail> {
  return apiFetch(`/admin/orders/${orderId}/status`, AdminOrderDetailSchema, {
    method: "POST",
    body,
  });
}

export function recordOrderPayment(
  orderId: string,
  body: RecordPaymentRequest,
): Promise<AdminOrderDetail> {
  return apiFetch(`/admin/orders/${orderId}/payments`, AdminOrderDetailSchema, {
    method: "POST",
    body,
  });
}

export function reviewPaymentProof(
  orderId: string,
  proofId: string,
  body: ReviewProofRequest,
): Promise<AdminOrderDetail> {
  return apiFetch(`/admin/orders/${orderId}/proofs/${proofId}`, AdminOrderDetailSchema, {
    method: "PATCH",
    body,
  });
}
