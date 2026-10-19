import { z } from "zod";

import { CountryCodeSchema, CountryParamSchema, IsoDateTimeSchema, ObjectIdSchema } from "./common";
import { CurrencyCodeSchema, MinorUnitsSchema } from "./money";
import { OrderNoteSchema, OrderNumberSchema, OrderSchema } from "./order";
import { OrderStatusSchema, StatusHistoryEntrySchema } from "./order-status";
import { PaymentModeSchema, PaymentRecordSchema, PaymentStatusSchema } from "./payment";

/** Orders per page in the admin list. Cursor pagination: no page numbers, no skipping. */
export const ADMIN_ORDERS_PAGE_SIZE = 25;
export const ADMIN_ORDERS_MAX_PAGE_SIZE = 100;

const DateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a date like 2026-10-19");

export const AdminOrderListQuerySchema = z.object({
  status: OrderStatusSchema.optional(),
  paymentStatus: PaymentStatusSchema.optional(),
  country: CountryParamSchema.optional(),
  /** Created on or after this day (UTC). */
  from: DateOnlySchema.optional(),
  /** Created on or before this day (UTC). */
  to: DateOnlySchema.optional(),
  /** Order number, phone or email. */
  search: z.string().trim().min(1).max(100).optional(),
  /** Only orders with a payment proof still waiting for staff ("Needs payment check"). */
  hasPendingProof: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
  /** Opaque: the `nextCursor` of the previous page. */
  cursor: z.string().min(1).max(200).optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(ADMIN_ORDERS_MAX_PAGE_SIZE)
    .default(ADMIN_ORDERS_PAGE_SIZE),
});
export type AdminOrderListQuery = z.infer<typeof AdminOrderListQuerySchema>;

export const AdminOrderListItemSchema = z.object({
  id: ObjectIdSchema,
  number: OrderNumberSchema,
  createdAt: IsoDateTimeSchema,
  country: CountryCodeSchema,
  customerName: z.string(),
  currency: CurrencyCodeSchema,
  totalMinor: MinorUnitsSchema,
  paymentMode: PaymentModeSchema,
  paymentStatus: PaymentStatusSchema,
  status: OrderStatusSchema,
  itemCount: z.number().int().nonnegative(),
  hasPendingProof: z.boolean(),
});
export type AdminOrderListItem = z.infer<typeof AdminOrderListItemSchema>;

export const AdminOrderListResponseSchema = z.object({
  items: z.array(AdminOrderListItemSchema),
  /** Null on the last page. */
  nextCursor: z.string().nullable(),
});
export type AdminOrderListResponse = z.infer<typeof AdminOrderListResponseSchema>;

/** A staff member's display name next to the id that is stored. Null if the account is gone. */
const ActorNameSchema = z.string().nullable();

/** The whole order for staff: everything the customer sees plus actors, notes and proofs. */
export const AdminOrderDetailSchema = OrderSchema.omit({
  history: true,
  payments: true,
  notes: true,
}).extend({
  history: z.array(StatusHistoryEntrySchema.extend({ actorName: ActorNameSchema })),
  payments: z.array(PaymentRecordSchema.extend({ recordedByName: ActorNameSchema })),
  notes: z.array(OrderNoteSchema.extend({ actorName: ActorNameSchema })),
});
export type AdminOrderDetail = z.infer<typeof AdminOrderDetailSchema>;

export const AddNoteRequestSchema = z.object({ text: z.string().trim().min(1).max(2000) });
export type AddNoteRequest = z.infer<typeof AddNoteRequestSchema>;

/**
 * What the staff dashboard shows. Money is never added across currencies:
 * revenue is one row per currency. "Revenue" is the money recorded as received
 * today (payment records), not order totals.
 */
export const DashboardSummarySchema = z.object({
  needsAction: z.object({
    /** Awaiting payment with a proof uploaded and not yet reviewed. */
    awaitingPaymentWithProof: z.number().int().nonnegative(),
    /** Confirmed: ready to make. */
    toMake: z.number().int().nonnegative(),
    /** Packed: waiting to be handed to a courier. */
    toShip: z.number().int().nonnegative(),
    deliveryFailed: z.number().int().nonnegative(),
  }),
  today: z.object({
    orders: z.number().int().nonnegative(),
    revenue: z.array(z.object({ currency: CurrencyCodeSchema, amountMinor: MinorUnitsSchema })),
  }),
  /** Orders created in the last 30 days, by country, most first. */
  ordersByCountry: z.array(
    z.object({ country: CountryCodeSchema, orders: z.number().int().nonnegative() }),
  ),
});
export type DashboardSummary = z.infer<typeof DashboardSummarySchema>;
