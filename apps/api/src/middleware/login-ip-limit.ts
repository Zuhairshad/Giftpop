import type { RequestHandler } from "express";
import { MemoryStore, rateLimit, type Store } from "express-rate-limit";

import { AppError } from "../lib/errors";

/**
 * The auth module limits sign-in per IP and email (5 a minute). That key changes with every
 * email, so one address could still try unlimited emails and, because an unknown email costs a
 * full argon2 hash (64 MiB, about 100 ms), burn CPU and memory. This second bucket counts every
 * login request from one IP regardless of the email.
 */
export const LOGIN_REQUESTS_PER_IP_PER_MINUTE = 30;

export interface LoginIpLimiterOptions {
  limit?: number;
  windowMs?: number;
  store?: Store;
}

/** The store behind the default limiter, exposed so tests can reset it. */
export const defaultLoginIpStore = new MemoryStore();

export function resetLoginIpRateLimit(): void {
  defaultLoginIpStore.resetAll();
}

export function createLoginIpLimiter({
  limit = LOGIN_REQUESTS_PER_IP_PER_MINUTE,
  windowMs = 60_000,
  store = defaultLoginIpStore,
}: LoginIpLimiterOptions = {}): RequestHandler {
  return rateLimit({
    windowMs,
    limit,
    store,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    handler: (_req, _res, next) => {
      next(new AppError("RATE_LIMITED", 429, "Too many sign-in attempts. Try again in a minute."));
    },
  });
}
