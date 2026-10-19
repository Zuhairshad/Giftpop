import type { PartnerRequestKind, PartnerRequestStatus } from "@giftpop/contracts";
import { model, Schema, type Types } from "mongoose";

export interface PartnerNoteDoc {
  at: Date;
  actorId: Types.ObjectId;
  text: string;
}

/** One flat document for both kinds; fields of the other kind are simply absent. */
export interface PartnerRequestDoc {
  _id: Types.ObjectId;
  kind: PartnerRequestKind;
  status: PartnerRequestStatus;
  contactName: string;
  email: string;
  phone: string;
  message: string;
  country: string;
  brandName?: string;
  productCategories?: string[];
  link?: string;
  offering?: string;
  notes: PartnerNoteDoc[];
  createdAt: Date;
  updatedAt: Date;
}

const noteSchema = new Schema(
  {
    at: { type: Date, required: true },
    actorId: { type: Schema.Types.ObjectId, required: true },
    text: { type: String, required: true },
  },
  { _id: false },
);

const partnerRequestSchema = new Schema(
  {
    kind: { type: String, required: true, enum: ["brand", "country"] },
    status: { type: String, required: true, enum: ["new", "in_talks", "accepted", "declined"] },
    contactName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    message: { type: String, default: "" },
    country: { type: String, required: true, uppercase: true },
    brandName: { type: String },
    productCategories: { type: [String], default: undefined },
    link: { type: String },
    offering: { type: String },
    notes: { type: [noteSchema], default: [] },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { versionKey: false, collection: "partnerRequests", timestamps: false },
);
partnerRequestSchema.index({ kind: 1, status: 1, createdAt: -1 });
partnerRequestSchema.index({ country: 1 });
partnerRequestSchema.index({ createdAt: -1, _id: -1 });
partnerRequestSchema.index({ status: 1, createdAt: -1, _id: -1 });
partnerRequestSchema.index({ kind: 1, createdAt: -1, _id: -1 });

export const PartnerRequestModel = model<PartnerRequestDoc>("PartnerRequest", partnerRequestSchema);
