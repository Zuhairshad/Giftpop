import type { NotificationChannel, NotificationType, OutboxStatus } from "@giftpop/contracts";
import { model, Schema, type Types } from "mongoose";

export interface OutboxDoc {
  _id: Types.ObjectId;
  type: NotificationType;
  orderId: Types.ObjectId;
  channel: NotificationChannel;
  payload: Record<string, unknown>;
  status: OutboxStatus;
  attempts: number;
  nextAttemptAt: Date;
  lastError?: string;
  createdAt: Date;
}

const outboxSchema = new Schema<OutboxDoc>(
  {
    type: { type: String, required: true },
    orderId: { type: Schema.Types.ObjectId, required: true },
    channel: { type: String, required: true },
    payload: { type: Schema.Types.Mixed, default: {} },
    status: { type: String, required: true, default: "pending" },
    attempts: { type: Number, required: true, default: 0 },
    nextAttemptAt: { type: Date, required: true, default: () => new Date() },
    lastError: { type: String },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: "notificationOutbox",
    minimize: false,
  },
);

// The worker claims the oldest due pending entries.
outboxSchema.index({ status: 1, nextAttemptAt: 1 });
// Delivered and failed messages are not kept for ever: they hold the text we sent.
outboxSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export const OutboxModel = model<OutboxDoc>("NotificationOutbox", outboxSchema);
