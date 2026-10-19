import { model, models, Schema, type Model } from "mongoose";

/** Asset metadata. The image bytes live in object storage under `key`, never here. */
export interface AssetDoc {
  key: string;
  url: string;
  width: number;
  height: number;
  anchor: { x: number; y: number };
  createdAt: Date;
}

const assetSchema = new Schema<AssetDoc>(
  {
    key: { type: String, required: true, unique: true },
    url: { type: String, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    anchor: {
      x: { type: Number, required: true, min: 0, max: 1 },
      y: { type: Number, required: true, min: 0, max: 1 },
    },
  },
  { collection: "assets", timestamps: { createdAt: true, updatedAt: false } },
);

export const AssetModel: Model<AssetDoc> =
  (models["Asset"] as Model<AssetDoc> | undefined) ?? model<AssetDoc>("Asset", assetSchema);
