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
  const result = ServerEnvSchema.safeParse({
    // An empty string in .env means "unset".
    API_URL: source.API_URL || undefined,
  });
  if (!result.success) {
    throw new Error(`Invalid environment: ${z.prettifyError(result.error)}`);
  }
  return result.data;
}
