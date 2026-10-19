import { STAFF_COOKIE_NAME } from "@giftpop/contracts";
import type { CookieOptions, Request, Response } from "express";

import { SESSION_TTL_MS } from "./config";

export function sessionCookieOptions(secure: boolean): CookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure,
    maxAge: SESSION_TTL_MS,
  };
}

export function setSessionCookie(res: Response, token: string, secure: boolean): void {
  res.cookie(STAFF_COOKIE_NAME, token, sessionCookieOptions(secure));
}

export function clearSessionCookie(res: Response, secure: boolean): void {
  // `clearCookie` must match the attributes the cookie was set with; it supplies its own expiry.
  const { httpOnly, sameSite, path } = sessionCookieOptions(secure);
  res.clearCookie(STAFF_COOKIE_NAME, { httpOnly, sameSite, path, secure });
}

/** The raw session token from the cookie, or undefined when absent or not a string. */
export function readSessionToken(req: Request): string | undefined {
  const cookies = req.cookies as Record<string, unknown> | undefined;
  const value = cookies?.[STAFF_COOKIE_NAME];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}
