import type { RequestHandler } from "express";

import { AppError } from "../lib/errors";

/** Deeper than any contract schema; stops a hostile body from costing stack or time. */
const MAX_DEPTH = 20;

/**
 * A field name that could be read as a MongoDB operator (`$ne`), a nested path (`a.b`),
 * or that targets the prototype. `[$` catches `a[$ne]` in a query string.
 */
export function isUnsafeKey(key: string): boolean {
  return (
    key.startsWith("$") ||
    key.includes(".") ||
    key.includes("\0") ||
    key === "__proto__" ||
    /\[\s*\$/.test(key)
  );
}

/** True when any object key, at any depth, is unsafe (or the value is nested too deeply). */
export function hasUnsafeKey(value: unknown, depth = 0): boolean {
  if (depth > MAX_DEPTH) return true;
  if (Array.isArray(value)) return value.some((entry) => hasUnsafeKey(entry, depth + 1));
  if (typeof value !== "object" || value === null) return false;
  return Object.entries(value).some(
    ([key, entry]) => isUnsafeKey(key) || hasUnsafeKey(entry, depth + 1),
  );
}

/**
 * Rejects (400 VALIDATION_ERROR) a body or query string with `$`-prefixed, dotted or
 * `__proto__` keys. Zod already strips unknown keys, but a `{ "$ne": null }` sent where a
 * string is expected must never reach a Mongo filter, so every endpoint is refused up front.
 * Mount it after the body parser.
 */
export function rejectOperatorKeys(): RequestHandler {
  return (req, _res, next) => {
    // Own, enumerable names only; the message never echoes the offending key.
    if (hasUnsafeKey(req.body) || hasUnsafeKey(req.query)) {
      next(
        new AppError("VALIDATION_ERROR", 400, "Request contains a field name that is not allowed"),
      );
      return;
    }
    next();
  };
}
