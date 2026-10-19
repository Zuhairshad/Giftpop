import type { AssetRecord, UpdateAssetAnchorRequest } from "@giftpop/contracts";

import { AppError } from "../../lib/errors";
import { newAssetKey, type Storage } from "../../lib/storage";

import { convertToWebp } from "./image";
import { AssetModel, type AssetDoc } from "./model";

/** Anchor for a fresh upload: bottom centre, where an item rests in its slot. */
export const DEFAULT_ANCHOR = { x: 0.5, y: 1 } as const;

interface StoredAsset extends AssetDoc {
  _id: { toString(): string };
}

function toRecord(doc: StoredAsset): AssetRecord {
  return {
    id: doc._id.toString(),
    url: doc.url,
    width: doc.width,
    height: doc.height,
    anchor: { x: doc.anchor.x, y: doc.anchor.y },
    createdAt: doc.createdAt.toISOString(),
  };
}

/** Convert an upload to WebP, store the bytes, and record the metadata. */
export async function createAsset(storage: Storage, upload: Buffer): Promise<AssetRecord> {
  const image = await convertToWebp(upload);
  const key = newAssetKey("webp");
  await storage.put(key, image.data, "image/webp");
  try {
    const doc = await AssetModel.create({
      key,
      url: storage.publicUrl(key),
      width: image.width,
      height: image.height,
      anchor: { ...DEFAULT_ANCHOR },
    });
    return toRecord(doc);
  } catch (error) {
    // Do not leave an orphan file behind when the metadata could not be saved.
    await storage.delete(key).catch(() => undefined);
    throw error;
  }
}

/** Move the anchor point. 404 if the asset does not exist. */
export async function updateAssetAnchor(
  id: string,
  { anchor }: UpdateAssetAnchorRequest,
): Promise<AssetRecord> {
  const doc = await AssetModel.findByIdAndUpdate(
    id,
    { $set: { anchor: { x: anchor.x, y: anchor.y } } },
    { returnDocument: "after" },
  ).lean<StoredAsset>();
  if (!doc) throw new AppError("NOT_FOUND", 404, "Asset not found");
  return toRecord(doc);
}
