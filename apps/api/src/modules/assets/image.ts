import type { ASSET_ACCEPTED_TYPES } from "@giftpop/contracts";
import { ASSET_MAX_SIDE_PX } from "@giftpop/contracts";
import sharp from "sharp";

import { AppError } from "../../lib/errors";

export type AcceptedType = (typeof ASSET_ACCEPTED_TYPES)[number];

/** Decoding limit that stops a tiny file from expanding into a huge bitmap. */
const MAX_INPUT_PIXELS = 50_000_000;

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG_SIGNATURE = [0xff, 0xd8, 0xff];

function startsWith(buffer: Buffer, signature: number[], offset = 0): boolean {
  return signature.every((byte, index) => buffer[offset + index] === byte);
}

/** Identify the image type from its first bytes. The client's mime type and name are ignored. */
export function detectImageType(buffer: Buffer): AcceptedType | undefined {
  if (startsWith(buffer, PNG_SIGNATURE)) return "image/png";
  if (startsWith(buffer, JPEG_SIGNATURE)) return "image/jpeg";
  // WebP is a RIFF container: "RIFF" <size> "WEBP".
  if (
    startsWith(buffer, [0x52, 0x49, 0x46, 0x46]) &&
    startsWith(buffer, [0x57, 0x45, 0x42, 0x50], 8)
  ) {
    return "image/webp";
  }
  return undefined;
}

export interface ProcessedImage {
  data: Buffer;
  width: number;
  height: number;
}

/**
 * Check the magic bytes, then decode and re-encode as WebP: EXIF rotation applied, longest side
 * capped at `ASSET_MAX_SIDE_PX` (never enlarged), alpha kept, metadata dropped.
 */
export async function convertToWebp(input: Buffer): Promise<ProcessedImage> {
  if (!detectImageType(input)) {
    throw new AppError(
      "VALIDATION_ERROR",
      415,
      "Upload a PNG, WebP or JPEG image. Other file types are not accepted.",
    );
  }
  try {
    const { data, info } = await sharp(input, {
      limitInputPixels: MAX_INPUT_PIXELS,
      failOn: "error",
    })
      .rotate()
      .resize({
        width: ASSET_MAX_SIDE_PX,
        height: ASSET_MAX_SIDE_PX,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 85, alphaQuality: 100 })
      .toBuffer({ resolveWithObject: true });
    return { data, width: info.width, height: info.height };
  } catch {
    throw new AppError(
      "VALIDATION_ERROR",
      400,
      "That image could not be read. Try exporting it again.",
    );
  }
}
