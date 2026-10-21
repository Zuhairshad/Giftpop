import { z } from "zod";

const DEFAULT_API_URL = "http://localhost:4000";

const ServerEnvSchema = z.object({
  API_URL: z.url().default(DEFAULT_API_URL),
});

/** Parses server-side env. Throws on bad config so the app refuses to boot. */
export function parseServerEnv(source: Record<string, string | undefined> = process.env) {
  const raw = source.API_URL?.trim();
  // The localhost default is for development only: a production build without API_URL would
  // bake a localhost rewrite in and fail on every call at runtime, so refuse it instead.
  if (!raw && source.NODE_ENV === "production") {
    throw new Error("Invalid environment: API_URL is required in production");
  }
  return ServerEnvSchema.parse({ API_URL: raw ? raw : undefined });
}

/** Base URL of the API with no trailing slash. Server-side only. */
export function getApiUrl(source: Record<string, string | undefined> = process.env): string {
  return parseServerEnv(source).API_URL.replace(/\/+$/, "");
}

/**
 * The public address of the shop, so staff can open it from the admin (for example to build a
 * gift to feature). Blank means unset: the admin then shows the steps without a link. A value that
 * is not an http(s) URL is a config error. Server-side only; the origin has no trailing slash.
 */
export function getWebOrigin(
  source: Record<string, string | undefined> = process.env,
): string | undefined {
  const raw = source.WEB_ORIGIN?.trim();
  if (!raw) return undefined;
  const result = z.url({ protocol: /^https?$/ }).safeParse(raw);
  if (!result.success) throw new Error("Invalid environment: WEB_ORIGIN must be an http(s) URL");
  return new URL(result.data).origin;
}
