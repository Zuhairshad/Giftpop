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
