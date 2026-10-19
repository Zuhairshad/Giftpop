import type { RequestHandler } from "express";
import multer, { MulterError } from "multer";

import { AppError } from "../../lib/errors";

export const PROOF_MAX_BYTES = 5 * 1024 * 1024;
export const PROOF_FIELD = "file";

// One image and one text field (`contact`); anything more is rejected while streaming.
const uploader = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: PROOF_MAX_BYTES, files: 1, fields: 1, parts: 2 },
});

function mapMulterError(error: unknown): unknown {
  if (!(error instanceof MulterError)) return error;
  if (error.code === "LIMIT_FILE_SIZE") {
    return new AppError(
      "VALIDATION_ERROR",
      413,
      `Image is too large. The limit is ${PROOF_MAX_BYTES / (1024 * 1024)} MB.`,
    );
  }
  return new AppError(
    "VALIDATION_ERROR",
    400,
    `Send the "contact" field and one image in the "${PROOF_FIELD}" field.`,
  );
}

/** Reads `req.body.contact` and `req.file` (memory). Multer errors become AppErrors. */
export const readProofUpload: RequestHandler = (req, res, next) => {
  uploader.single(PROOF_FIELD)(req, res, (error: unknown) => {
    if (error) return next(mapMulterError(error));
    if (!req.file) {
      return next(
        new AppError("VALIDATION_ERROR", 400, `Send the image in the "${PROOF_FIELD}" field.`),
      );
    }
    next();
  });
};
