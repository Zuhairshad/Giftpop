import { z } from "zod";

import { IsoDateTimeSchema, ObjectIdSchema } from "./common";

export const ORDER_STATUSES = [
  "awaiting_payment",
  "confirmed",
  "in_production",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivery_failed",
  "delivered",
  "returned",
  "cancelled",
] as const;
export const OrderStatusSchema = z.enum(ORDER_STATUSES);
export type OrderStatus = z.infer<typeof OrderStatusSchema>;

/** The transition table from docs/product.md. Nothing else may change `order.status`. */
export const ORDER_TRANSITIONS: Readonly<Record<OrderStatus, readonly OrderStatus[]>> = {
  awaiting_payment: ["confirmed", "cancelled"],
  confirmed: ["in_production", "cancelled"],
  in_production: ["packed", "cancelled"],
  packed: ["shipped"],
  shipped: ["out_for_delivery", "returned"],
  out_for_delivery: ["delivered", "delivery_failed"],
  delivery_failed: ["out_for_delivery", "returned"],
  delivered: [],
  returned: [],
  cancelled: [],
};

export const TERMINAL_STATUSES: readonly OrderStatus[] = ORDER_STATUSES.filter(
  (status) => ORDER_TRANSITIONS[status].length === 0,
);

/** Fields a staff member must provide to move into a status. */
export const TransitionFieldsSchema = z.object({
  note: z.string().max(1000).optional(),
  courier: z.string().trim().min(1).max(80).optional(),
  trackingNumber: z.string().trim().min(1).max(80).optional(),
  trackingUrl: z.url().max(500).optional(),
  reason: z.string().trim().min(1).max(500).optional(),
});
export type TransitionFields = z.infer<typeof TransitionFieldsSchema>;

export const REQUIRED_FIELDS: Readonly<
  Partial<Record<OrderStatus, readonly (keyof TransitionFields)[]>>
> = {
  shipped: ["courier", "trackingNumber"],
  cancelled: ["reason"],
};

export const StatusChangeRequestSchema = TransitionFieldsSchema.extend({
  to: OrderStatusSchema,
}).superRefine((value, ctx) => {
  for (const field of REQUIRED_FIELDS[value.to] ?? []) {
    if (!value[field]) {
      ctx.addIssue({
        code: "custom",
        path: [field],
        message: `${field} is required to mark an order as ${value.to}`,
      });
    }
  }
});
export type StatusChangeRequest = z.infer<typeof StatusChangeRequestSchema>;

/** Append-only. `from` is null for the entry that creates the order. */
export const StatusHistoryEntrySchema = z.object({
  from: OrderStatusSchema.nullable(),
  to: OrderStatusSchema,
  at: IsoDateTimeSchema,
  /** Staff id; null when the system or the customer caused it. */
  actorId: ObjectIdSchema.nullable(),
  note: z.string().max(1000).optional(),
});
export type StatusHistoryEntry = z.infer<typeof StatusHistoryEntrySchema>;

export type TransitionErrorCode = "INVALID_TRANSITION" | "MISSING_TRANSITION_FIELD";

export class TransitionError extends Error {
  constructor(
    readonly code: TransitionErrorCode,
    message: string,
    readonly details: { from: OrderStatus; to: OrderStatus; missing?: string[] },
  ) {
    super(message);
    this.name = "TransitionError";
  }
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from].includes(to);
}

export function nextStatuses(from: OrderStatus): readonly OrderStatus[] {
  return ORDER_TRANSITIONS[from];
}

/** Throws `TransitionError` if the move is not allowed or a required field is missing. */
export function assertTransition(
  from: OrderStatus,
  to: OrderStatus,
  fields: TransitionFields = {},
): void {
  if (!canTransition(from, to)) {
    throw new TransitionError("INVALID_TRANSITION", `Cannot move an order from ${from} to ${to}`, {
      from,
      to,
    });
  }
  const missing = (REQUIRED_FIELDS[to] ?? []).filter((field) => !fields[field]?.trim());
  if (missing.length > 0) {
    throw new TransitionError(
      "MISSING_TRANSITION_FIELD",
      `Marking an order as ${to} needs: ${missing.join(", ")}`,
      { from, to, missing },
    );
  }
}
