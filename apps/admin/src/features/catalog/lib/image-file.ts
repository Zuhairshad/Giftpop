import { ASSET_ACCEPTED_TYPES, ASSET_MAX_BYTES } from "@giftpop/contracts";

/** The `accept` attribute for the file input. */
export const IMAGE_ACCEPT = ASSET_ACCEPTED_TYPES.join(",");

const MAX_MB = ASSET_MAX_BYTES / (1024 * 1024);

/** Returns a reason the file cannot be uploaded, or null when it can. The API checks again. */
export function imageFileProblem(file: { type: string; size: number }): string | null {
  if (!(ASSET_ACCEPTED_TYPES as readonly string[]).includes(file.type)) {
    return "Use a PNG, WebP or JPEG image.";
  }
  if (file.size > ASSET_MAX_BYTES) return `The image must be ${MAX_MB} MB or smaller.`;
  if (file.size === 0) return "That file is empty.";
  return null;
}
