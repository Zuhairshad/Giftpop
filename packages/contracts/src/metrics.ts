import { z } from "zod";

import { OrderStatusSchema } from "./order-status";

const Minutes = z.number().int().min(0).nullable();

/** `GET /v1/admin/metrics`: counts for uptime checks and the runbook. No personal data. */
export const MetricsResponseSchema = z.object({
  generatedAt: z.iso.datetime(),
  orders: z.object({
    byStatus: z.record(OrderStatusSchema, z.number().int().min(0)),
    createdLast24h: z.number().int().min(0),
    createdLast7d: z.number().int().min(0),
    /** Minutes since the oldest order still `awaiting_payment` was placed; null when none. */
    oldestAwaitingPaymentAgeMinutes: Minutes,
    /** Minutes since the oldest order still `confirmed` was placed; null when none. */
    oldestConfirmedAgeMinutes: Minutes,
  }),
  outbox: z.object({
    pending: z.number().int().min(0),
    failed: z.number().int().min(0),
    /** Minutes the most overdue pending message has waited past its due time; null when none. */
    oldestPendingAgeMinutes: Minutes,
  }),
  process: z.object({
    uptimeSeconds: z.number().int().min(0),
    mongoReady: z.boolean(),
    version: z.string(),
  }),
});
export type MetricsResponse = z.infer<typeof MetricsResponseSchema>;
