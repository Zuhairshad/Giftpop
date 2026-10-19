import type { StaffRole, StaffUser } from "@giftpop/contracts";
import { model, Schema, type HydratedDocument, type InferSchemaType } from "mongoose";

const ROLES: StaffRole[] = ["owner", "staff"];

const staffSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    /** argon2id hash. Never leaves the api: see `toStaffUser`. */
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, enum: ROLES, required: true },
    active: { type: Boolean, required: true, default: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export type StaffDoc = HydratedDocument<InferSchemaType<typeof staffSchema>>;

export const StaffModel = model("Staff", staffSchema, "staff");

/** The only way a staff document becomes a response: an explicit allow-list, no hash. */
export function toStaffUser(doc: StaffDoc): StaffUser {
  return {
    id: doc.id,
    email: doc.email,
    name: doc.name,
    role: doc.role,
    active: doc.active,
    createdAt: doc.createdAt.toISOString(),
  };
}
