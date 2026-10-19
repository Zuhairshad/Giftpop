import type { Design } from "@giftpop/contracts";
import { model, Schema, type Types } from "mongoose";

export interface TemplateDoc {
  _id: Types.ObjectId;
  title: string;
  description: string;
  shareId: string;
  /** Copied from the saved design so the template survives if that record goes. */
  design: Design;
  countries: string[];
  active: boolean;
  sortOrder: number;
  createdAt: Date;
}

const templateSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    shareId: { type: String, required: true },
    design: { type: Schema.Types.Mixed, required: true },
    countries: { type: [String], required: true },
    active: { type: Boolean, required: true, default: true },
    sortOrder: { type: Number, required: true, default: 0 },
    createdAt: { type: Date, required: true },
  },
  { versionKey: false, collection: "featuredTemplates", minimize: false },
);
templateSchema.index({ active: 1, sortOrder: 1 });
templateSchema.index({ shareId: 1 });

export const TemplateModel = model<TemplateDoc>("FeaturedTemplate", templateSchema);
