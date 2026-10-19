/** Masks personal data in anything that reaches a log line or an error report. */

export const MASK = "[redacted]";

/** Keys whose value is always replaced, compared lower case with `-` and `_` removed. */
const EXACT_KEYS = new Set([
  "phone",
  "email",
  "contact",
  "address",
  "line1",
  "line2",
  "cardmessage",
  "recipientname",
  "itemnames",
  "cookie",
  "cookies",
  "authorization",
  "setcookie",
  "xapikey",
  "apikey",
  "keyvalue",
]);

/** Keys that are masked when they merely contain one of these words. */
const PARTIAL_KEYS = ["password", "token", "secret"];

/** Keys that hold ids we generate ourselves; digits in them must survive the phone mask. */
const SAFE_KEYS = new Set(["requestid", "reqid"]);

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g;
// A run of digits with common separators, at least 7 digits in total (checked below).
const PHONE = /(?<![\w.])\+?\(?\d[\d\s().-]{5,}\d(?!\w)/g;

const MAX_DEPTH = 8;

function normaliseKey(key: string): string {
  return key.toLowerCase().replace(/[-_\s]/g, "");
}

export function isSensitiveKey(key: string): boolean {
  const k = normaliseKey(key);
  return EXACT_KEYS.has(k) || PARTIAL_KEYS.some((word) => k.includes(word));
}

/** Replaces email-looking and phone-looking text inside a string. */
export function maskText(text: string): string {
  return text.replace(EMAIL, "[email]").replace(PHONE, (match) => {
    const digits = match.replace(/\D/g, "").length;
    return digits >= 7 && digits <= 15 ? "[phone]" : match;
  });
}

function maskError(error: Error, depth: number, seen: WeakSet<object>): Record<string, unknown> {
  const out: Record<string, unknown> = {
    type: error.name,
    message: maskText(error.message),
  };
  if (error.stack) out.stack = maskText(error.stack);
  for (const [key, value] of Object.entries(error)) {
    if (key in out) continue;
    out[key] = isSensitiveKey(key) ? MASK : maskValue(value, depth + 1, seen);
  }
  if (error.cause !== undefined) out.cause = maskValue(error.cause, depth + 1, seen);
  return out;
}

/** Deep copy of `value` with sensitive keys replaced and strings scrubbed. Never mutates. */
export function maskValue(value: unknown, depth = 0, seen = new WeakSet<object>()): unknown {
  if (typeof value === "string") return maskText(value);
  if (value === null || typeof value !== "object") return value;
  if (depth >= MAX_DEPTH) return "[truncated]";
  if (seen.has(value)) return "[circular]";
  seen.add(value);
  try {
    if (value instanceof Error) return maskError(value, depth, seen);
    if (value instanceof Date) return value;
    if (Array.isArray(value)) return value.map((item) => maskValue(item, depth + 1, seen));
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value)) {
      if (SAFE_KEYS.has(normaliseKey(key))) out[key] = child;
      else out[key] = isSensitiveKey(key) ? MASK : maskValue(child, depth + 1, seen);
    }
    return out;
  } finally {
    seen.delete(value);
  }
}

/** Same as `maskValue` for an object that is known to be an object. */
export function maskRecord(record: Record<string, unknown>): Record<string, unknown> {
  const masked = maskValue(record);
  return typeof masked === "object" && masked !== null ? (masked as Record<string, unknown>) : {};
}
