import { z } from "zod";

const DEFAULT_API_URL = "http://localhost:4000";

/** Server-only config. Nothing here is a NEXT_PUBLIC value, and nothing here reaches the browser. */
const ServerEnvSchema = z.object({
  API_URL: z
    .url()
    .default(DEFAULT_API_URL)
    .transform((url) => url.replace(/\/+$/, "")),
});
type ServerEnv = z.infer<typeof ServerEnvSchema>;

/** Parses the environment and throws a readable error, so the app refuses to start on bad config. */
export function parseServerEnv(
  source: Record<string, string | undefined> = process.env,
): ServerEnv {
  // An empty string in .env means "unset".
  const apiUrl = source.API_URL?.trim() || undefined;
  // The localhost default is for development only: a production build without API_URL would
  // bake a localhost rewrite in and fail on every call at runtime, so refuse it instead.
  if (!apiUrl && source.NODE_ENV === "production") {
    throw new Error("Invalid environment: API_URL is required in production");
  }
  const result = ServerEnvSchema.safeParse({ API_URL: apiUrl });
  if (!result.success) {
    throw new Error(`Invalid environment: ${z.prettifyError(result.error)}`);
  }
  return result.data;
}
