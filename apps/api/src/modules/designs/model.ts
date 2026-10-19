import type { Design } from "@giftpop/contracts";
import { model, Schema, type Types } from "mongoose";

export interface DesignDoc {
  _id: Types.ObjectId;
  shareId: string;
  country: string;
  design: Design;
  createdAt: Date;
}

const designSchema = new Schema(
  {
    shareId: { type: String, required: true, unique: true },
    country: { type: String, required: true, uppercase: true },
    // Stored exactly as validated by the contract; read back through `DesignSchema`.
    design: { type: Schema.Types.Mixed, required: true },
    createdAt: { type: Date, required: true },
  },
  { versionKey: false, collection: "designs", minimize: false },
);
designSchema.index({ createdAt: -1 });

export const DesignModel = model<DesignDoc>("Design", designSchema);
