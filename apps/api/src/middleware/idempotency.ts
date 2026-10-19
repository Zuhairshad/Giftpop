import type { RequestHandler } from "express";

export interface IdempotencyOptions {
  /** How long a stored response is replayed. Defaults to 24 hours. */
  ttlMs?: number;
}

/**
 * Makes a POST safe to retry. Reads the `Idempotency-Key` header: the same key with
 * the same body within the window replays the first response, the same key with a
 * different body answers 409.
 *
 * STUB: passes every request through until `api-orders` implements it.
 */
export function idempotency(_options: IdempotencyOptions = {}): RequestHandler {
  return (_req, _res, next) => next();
}
