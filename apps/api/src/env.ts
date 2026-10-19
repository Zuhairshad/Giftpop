import { z } from "zod";

const LOG_LEVELS = ["fatal", "error", "warn", "info", "debug", "trace", "silent"] as const;

const csv = z
  .string()
  .transform((value) =>
    value
      .split(",")
      .map((part) => part.trim())
      .filter((part) => part.length > 0),
  )
  .pipe(z.array(z.url("Each CORS origin must be a full URL such as http://localhost:3000")));

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  MONGODB_URI: z
    .string()
    .min(1, "MONGODB_URI is required")
    .refine((uri) => /^mongodb(\+srv)?:\/\//.test(uri), "MONGODB_URI must start with mongodb://"),
  LOG_LEVEL: z.enum(LOG_LEVELS).default("info"),
  /** Comma separated list of browser origins allowed to call the API. */
  CORS_ORIGINS: csv.default(() => []),
  /** How many times to try the first MongoDB connection before giving up. */
  DB_CONNECT_MAX_ATTEMPTS: z.coerce.number().int().min(1).max(100).default(10),
  /** First retry delay in ms; doubles each attempt up to 10 seconds. */
  DB_CONNECT_BASE_DELAY_MS: z.coerce.number().int().min(10).max(10_000).default(250),
});

export type Env = z.infer<typeof EnvSchema>;

export class EnvError extends Error {
  constructor(readonly issues: z.core.$ZodIssue[]) {
    super(
      `Invalid environment configuration:\n${issues
        .map((issue) => `  ${issue.path.join(".") || "(root)"}: ${issue.message}`)
        .join("\n")}`,
    );
    this.name = "EnvError";
  }
}

/** Pure parser: throws `EnvError` on bad config. Pass `process.env` at boot. */
export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = EnvSchema.safeParse(source);
  if (!result.success) throw new EnvError(result.error.issues);
  return result.data;
}
