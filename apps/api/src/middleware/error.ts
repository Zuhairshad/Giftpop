import { TransitionError, type ApiErrorCode, type ErrorResponse } from "@giftpop/contracts";
import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";

import { AppError, isDuplicateKeyError } from "../lib/errors";

interface HttpError {
  status: number;
  type: string;
}

function isHttpError(error: unknown): error is HttpError {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof error.status === "number" &&
    "type" in error &&
    typeof error.type === "string"
  );
}

interface Normalised {
  status: number;
  body: ErrorResponse;
}

function respond(
  code: ApiErrorCode,
  status: number,
  message: string,
  details?: unknown,
): Normalised {
  const error: ErrorResponse["error"] = { code, message };
  if (details !== undefined) error.details = details;
  return { status, body: { error } };
}

/** Turn any thrown value into a safe `{ error }` response. Never includes a stack. */
function normaliseError(error: unknown): Normalised {
  if (error instanceof AppError) {
    return respond(error.code, error.httpStatus, error.message, error.details);
  }
  if (error instanceof ZodError) {
    return respond("VALIDATION_ERROR", 400, "Request validation failed", error.issues);
  }
  if (error instanceof TransitionError) {
    const status = error.code === "INVALID_TRANSITION" ? 409 : 422;
    return respond(error.code, status, error.message, error.details);
  }
  if (isHttpError(error)) {
    if (error.type === "entity.too.large") {
      return respond("VALIDATION_ERROR", 413, "Request body is too large");
    }
    if (error.status >= 400 && error.status < 500) {
      return respond("VALIDATION_ERROR", 400, "Request body could not be read");
    }
  }
  if (isDuplicateKeyError(error)) {
    return respond("CONFLICT", 409, "That record already exists");
  }
  return respond("INTERNAL", 500, "Something went wrong");
}

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new AppError("NOT_FOUND", 404, `No route for ${req.method} ${req.path}`));
};

export const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }
  const { status, body } = normaliseError(error);
  if (status >= 500) req.log.error({ err: error }, "Unhandled error");
  res.status(status).json(body);
};
