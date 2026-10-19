import type { RequestHandler } from "express";
import { MemoryStore, rateLimit, type Store } from "express-rate-limit";

import { AppError } from "../../lib/errors";

export const QUOTES_PER_MINUTE = 60;

export interface IpLimiterOptions {
  limit: number;
  windowMs?: number;
  store?: Store;
  message?: string;
}

/**
 * One bucket per client IP (IPv6 addresses are grouped by the library's default
 * key generator). Answers 429 with code RATE_LIMITED. Tests pass their own
 * `limit`, `windowMs` or `store`. The designs module reuses this.
 */
export function createIpLimiter({
  limit,
  windowMs = 60_000,
  store,
  message = "Too many requests. Try again in a minute.",
}: IpLimiterOptions): RequestHandler {
  return rateLimit({
    windowMs,
    limit,
    ...(store ? { store } : {}),
    standardHeaders: "draft-7",
    legacyHeaders: false,
    handler: (_req, _res, next) => {
      next(new AppError("RATE_LIMITED", 429, message));
    },
  });
}

/** The store behind the default quote limiter, exposed so tests can reset it. */
export const defaultQuoteStore = new MemoryStore();

export function resetQuoteRateLimit(): void {
  defaultQuoteStore.resetAll();
}
