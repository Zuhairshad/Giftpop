import type { Money, Order, PaymentMethod } from "@giftpop/contracts";
import type { ClientSession } from "mongoose";

/**
 * Records money received against an order (staff action, exposed in phase 4):
 * adds the payment record, updates the payment status, and moves
 * `awaiting_payment` to `confirmed` through `transitionOrder` once the amount due now
 * is covered.
 *
 * STUB: `api-payments` implements it.
 */
export async function recordPayment(
  _orderId: string,
  _amount: Money,
  _method: PaymentMethod,
  _staffId: string,
  _options?: { reference?: string; note?: string; session?: ClientSession },
): Promise<Order> {
  throw new Error("not implemented");
}
