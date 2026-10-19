import type { Request, RequestHandler } from "express";
import { ipKeyGenerator, MemoryStore, rateLimit, type Store } from "express-rate-limit";

import { AppError } from "../../lib/errors";

import { normaliseEmail } from "./email";

export const LOGIN_ATTEMPTS_PER_MINUTE = 5;

export interface LoginLimiterOptions {
  limit?: number;
  windowMs?: number;
  store?: Store;
}

/** One bucket per client IP and email, so one attacker cannot lock out a whole office. */
function loginKey(req: Request): string {
  const body: unknown = req.body;
  const email =
    typeof body === "object" && body !== null && "email" in body && typeof body.email === "string"
      ? normaliseEmail(body.email)
      : "";
  return `${ipKeyGenerator(req.ip ?? "unknown")}|${email}`;
}

/** Build a limiter. Tests pass their own `limit`, `windowMs` or `store`. */
export function createLoginLimiter({
  limit = LOGIN_ATTEMPTS_PER_MINUTE,
  windowMs = 60_000,
  store,
}: LoginLimiterOptions = {}): RequestHandler {
  return rateLimit({
    windowMs,
    limit,
    ...(store ? { store } : {}),
    keyGenerator: loginKey,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    handler: (_req, _res, next) => {
      next(new AppError("RATE_LIMITED", 429, "Too many sign-in attempts. Try again in a minute."));
    },
  });
}

/** The store behind the default limiter, exposed so tests can reset it. */
export const defaultLoginStore = new MemoryStore();

export function resetLoginRateLimit(): void {
  defaultLoginStore.resetAll();
}
