import {
  assertTransition,
  type Order,
  type OrderStatus,
  type TransitionFields,
} from "@giftpop/contracts";
import type { ClientSession } from "mongoose";

import { AppError } from "../../lib/errors";
import { enqueue } from "../notifications/service";

import { toObjectId, toOrder } from "./mappers";
import { OrderModel, type OrderDoc, type OrderHistoryDoc } from "./model";

export interface TransitionInput {
  /** The staff member, or null when the system or the customer's own action causes it. */
  actorId: string | null;
  fields?: TransitionFields;
  session?: ClientSession;
}

/**
 * The only way an order's status changes (CLAUDE.md rule 6). Checks the state
 * machine and the fields the target needs, appends the history entry with the actor
 * and, in the same write, sets the shipment for `shipped`. The write only applies if
 * the status is still what was read, so two staff members cannot both move one order.
 */
export async function transitionOrder(
  orderId: string,
  to: OrderStatus,
  input: TransitionInput,
): Promise<Order> {
  const { actorId, fields = {}, session } = input;
  const current = await OrderModel.findById(orderId)
    .session(session ?? null)
    .lean<OrderDoc>();
  if (!current) throw new AppError("NOT_FOUND", 404, "No order with that id");

  // Throws TransitionError, which the error middleware answers with 409 or 422.
  assertTransition(current.status, to, fields);

  const note = [fields.reason, fields.note].filter(Boolean).join(": ");
  const entry: OrderHistoryDoc = {
    from: current.status,
    to,
    at: new Date(),
    actorId: actorId ? toObjectId(actorId) : null,
    ...(note ? { note } : {}),
  };
  const set: Record<string, unknown> = { status: to };
  if (to === "shipped" && fields.courier && fields.trackingNumber) {
    set["shipment"] = {
      courier: fields.courier,
      trackingNumber: fields.trackingNumber,
      ...(fields.trackingUrl ? { trackingUrl: fields.trackingUrl } : {}),
      shippedAt: entry.at,
    };
  }

  const updated = await OrderModel.findOneAndUpdate(
    { _id: current._id, status: current.status },
    { $set: set, $push: { history: entry } },
    { returnDocument: "after", session },
  ).lean<OrderDoc>();
  if (!updated) throw new AppError("CONFLICT", 409, "This order was changed by someone else");

  await enqueue(
    { type: "status_changed", orderId, payload: { number: updated.number, status: to } },
    session,
  );
  return toOrder(updated);
}
