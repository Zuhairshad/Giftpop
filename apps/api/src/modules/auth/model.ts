import { model, Schema } from "mongoose";

const sessionSchema = new Schema(
  {
    /** HMAC-SHA256 of the cookie token. The token itself is never stored. */
    tokenHash: { type: String, required: true, unique: true },
    staffId: { type: Schema.Types.ObjectId, ref: "Staff", required: true, index: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
// MongoDB removes the document shortly after `expiresAt` (the reaper runs about once a minute),
// so lookups still compare `expiresAt` themselves.
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const SessionModel = model("StaffSession", sessionSchema, "staffSessions");
