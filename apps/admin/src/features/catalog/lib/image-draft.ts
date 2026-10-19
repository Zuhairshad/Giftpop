import { AssetSchema } from "@giftpop/contracts";
import type { Asset } from "@giftpop/contracts";

import type { Anchor } from "./anchor";
import { sameAnchor } from "./anchor";

/**
 * An image being edited. `assetId` is set once the API has the file (after an upload).
 * An image loaded from an item or packaging has no id: the API stores it inline, so
 * a moved anchor is saved by saving the item or packaging itself.
 */
export interface ImageDraft {
  asset: Asset;
  assetId?: string | undefined;
  /** The anchor was moved after the API last saw it. */
  anchorChanged: boolean;
}

/** The inline asset from an API record (an upload response has an id and a date besides). */
function toAsset(record: Asset): Asset {
  return AssetSchema.parse(record);
}

export function draftFromAsset(asset: Asset | undefined): ImageDraft | undefined {
  return asset ? { asset, anchorChanged: false } : undefined;
}

export function draftFromUpload(record: Asset & { id: string }): ImageDraft {
  return { asset: toAsset(record), assetId: record.id, anchorChanged: false };
}

export function moveAnchor(draft: ImageDraft, anchor: Anchor): ImageDraft {
  if (sameAnchor(draft.asset.anchor, anchor)) return draft;
  return { ...draft, asset: { ...draft.asset, anchor }, anchorChanged: true };
}

export type PatchAnchor = (assetId: string, anchor: Anchor) => Promise<Asset>;

/**
 * The asset to store inline on the item or packaging. When the API holds the file and the
 * anchor moved, it is PATCHed first so the stored asset and the inline copy agree.
 */
export async function commitImageDraft(
  draft: ImageDraft | undefined,
  patchAnchor: PatchAnchor,
): Promise<Asset | undefined> {
  if (!draft) return undefined;
  if (draft.assetId && draft.anchorChanged) {
    return toAsset(await patchAnchor(draft.assetId, draft.asset.anchor));
  }
  return draft.asset;
}

/** After a successful save the API and the draft agree again. */
export function markCommitted(draft: ImageDraft | undefined): ImageDraft | undefined {
  return draft ? { ...draft, anchorChanged: false } : undefined;
}
