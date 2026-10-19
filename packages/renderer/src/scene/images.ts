import type { Asset } from "@giftpop/contracts";

import { ITEM_BASE_SIZE, SCENE_SIZE } from "../layouts";

/** A rectangle in scene units. Fixed before an image loads, so loading never moves anything. */
export interface ImageBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type ImageStatus = "pending" | "loaded" | "error";
export type ImageEvent = "load" | "error";

/** Packaging layers cover the whole scene. */
export const LAYER_BOX: ImageBox = { x: 0, y: 0, width: SCENE_SIZE, height: SCENE_SIZE };

/** An item image fitted into a base-size square, positioned so its anchor sits on the origin. */
export function itemImageBox(image: Asset): ImageBox {
  const fit = ITEM_BASE_SIZE / Math.max(image.width, image.height);
  const width = image.width * fit;
  const height = image.height * fit;
  // `+ 0` turns -0 into 0 so an anchor of 0 never renders as x="-0".
  return { x: -image.anchor.x * width + 0, y: -image.anchor.y * height + 0, width, height };
}

/** Reducer for an image's load state. A failed image stays failed until its URL changes. */
export function nextImageStatus(current: ImageStatus, event: ImageEvent): ImageStatus {
  if (current === "error") return "error";
  return event === "load" ? "loaded" : "error";
}

/** The placeholder shows until the real image has loaded, and for good if it fails. */
export function showsPlaceholder(status: ImageStatus): boolean {
  return status !== "loaded";
}

/** Fetch the image only once the scene is near the viewport, and never after a failure. */
export function shouldMountImage(status: ImageStatus, nearViewport: boolean): boolean {
  return nearViewport && status !== "error";
}

/** Attributes browsers use to defer and decode off the main thread; SVG typings do not list them. */
export const LAZY_IMAGE_ATTRS: Record<string, string> = { loading: "lazy", decoding: "async" };
