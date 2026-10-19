import { z } from "zod";

import { IsoDateTimeSchema, ObjectIdSchema } from "./common";

/** `staff_alert` goes to the team (for example a new partner request) and belongs to no order. */
export const NOTIFICATION_TYPES = [
  "order_created",
  "payment_recorded",
  "status_changed",
  "staff_alert",
] as const;
export const NotificationTypeSchema = z.enum(NOTIFICATION_TYPES);
export type NotificationType = z.infer<typeof NotificationTypeSchema>;

/** `console` prints in development; `email` is an interface whose provider is chosen later. */
export const NotificationChannelSchema = z.enum(["console", "email"]);
export type NotificationChannel = z.infer<typeof NotificationChannelSchema>;

export const OutboxStatusSchema = z.enum(["pending", "sent", "failed"]);
export type OutboxStatus = z.infer<typeof OutboxStatusSchema>;

/** One queued message. Written in the same transaction as the change that caused it. */
export const OutboxEntrySchema = z.object({
  id: ObjectIdSchema,
  type: NotificationTypeSchema,
  /** Absent for `staff_alert`. */
  orderId: ObjectIdSchema.optional(),
  channel: NotificationChannelSchema,
  /** What the template needs; never staff notes. */
  payload: z.record(z.string(), z.unknown()),
  status: OutboxStatusSchema,
  attempts: z.number().int().nonnegative(),
  nextAttemptAt: IsoDateTimeSchema,
  lastError: z.string().optional(),
  createdAt: IsoDateTimeSchema,
});
export type OutboxEntry = z.infer<typeof OutboxEntrySchema>;
