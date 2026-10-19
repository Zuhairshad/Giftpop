import { ASSET_MAX_BYTES } from "@giftpop/contracts";
import type { RequestHandler } from "express";
import multer, { MulterError } from "multer";

import { AppError } from "../../lib/errors";

/** The multipart field the file comes in. */
export const UPLOAD_FIELD = "file";

const uploader = multer({
  storage: multer.memoryStorage(),
  // One file, held in memory. The size limit is enforced while streaming, not after.
  limits: { fileSize: ASSET_MAX_BYTES, files: 1, fields: 0, parts: 2 },
});

function mapMulterError(error: unknown): unknown {
  if (!(error instanceof MulterError)) return error;
  if (error.code === "LIMIT_FILE_SIZE") {
    const megabytes = ASSET_MAX_BYTES / (1024 * 1024);
    return new AppError(
      "VALIDATION_ERROR",
      413,
      `Image is too large. The limit is ${megabytes} MB.`,
    );
  }
  return new AppError(
    "VALIDATION_ERROR",
    400,
    `Send exactly one image in the "${UPLOAD_FIELD}" field.`,
  );
}

/**
 * Read one multipart file into `req.file` (memory). Multer errors become `AppError`s so the
 * shared error middleware answers them. Fails with 400 when no file was sent.
 */
export const readUpload: RequestHandler = (req, res, next) => {
  uploader.single(UPLOAD_FIELD)(req, res, (error: unknown) => {
    if (error) {
      next(mapMulterError(error));
      return;
    }
    if (!req.file) {
      next(
        new AppError(
          "VALIDATION_ERROR",
          400,
          `Send the image as multipart form data in the "${UPLOAD_FIELD}" field.`,
        ),
      );
      return;
    }
    next();
  });
};
