import type { ApiErrorCode } from "@giftpop/contracts";

/** Throw this from services and routers; the error middleware turns it into `{ error }`. */
export class AppError extends Error {
  constructor(
    readonly code: ApiErrorCode,
    readonly httpStatus: number,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

const MONGO_DUPLICATE_KEY = 11000;

/** True for the error MongoDB raises when a write breaks a unique index. */
export function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === MONGO_DUPLICATE_KEY
  );
}
