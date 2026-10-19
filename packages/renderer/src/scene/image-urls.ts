import type { Asset, Item, Packaging } from "@giftpop/contracts";

/** Pixel widths asked for: an item is drawn small inside the scene, a layer fills it (2x screens). */
export const ITEM_IMAGE_WIDTH = 256;
export const LAYER_IMAGE_WIDTH = 750;

/** Turns an asset URL into one for a copy about `width` pixels wide, such as a resizing service. */
export type ImageUrlFn = (url: string, width: number) => string;

interface SceneAssets {
  packaging: Packaging;
  items: readonly Item[];
}

function resized(asset: Asset, imageUrl: ImageUrlFn, width: number): Asset {
  return { ...asset, url: imageUrl(asset.url, width) };
}

/**
 * The same packaging and items with every image URL passed through `imageUrl`, so the scene
 * downloads a copy sized for how it is drawn instead of the full upload. Inputs are not changed.
 */
export function withImageUrls<T extends SceneAssets>(
  input: T,
  imageUrl: ImageUrlFn | undefined,
): T {
  if (!imageUrl) return input;
  const { back, front } = input.packaging.layers;
  return {
    ...input,
    packaging: {
      ...input.packaging,
      layers: {
        ...(back ? { back: resized(back, imageUrl, LAYER_IMAGE_WIDTH) } : {}),
        ...(front ? { front: resized(front, imageUrl, LAYER_IMAGE_WIDTH) } : {}),
      },
    },
    items: input.items.map((item) =>
      item.image ? { ...item, image: resized(item.image, imageUrl, ITEM_IMAGE_WIDTH) } : item,
    ),
  };
}
