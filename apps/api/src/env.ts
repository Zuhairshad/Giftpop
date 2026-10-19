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

const url = (name: string) => z.url(`${name} must be a full URL such as http://localhost:3001`);

const EnvObjectSchema = z.object({
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
  /** Peppers the hash of staff session tokens. At least 32 characters; required in production. */
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 characters").optional(),
  /** Where the admin app and the store are served from (used for CORS and links). */
  ADMIN_ORIGIN: url("ADMIN_ORIGIN").default("http://localhost:3001"),
  WEB_ORIGIN: url("WEB_ORIGIN").default("http://localhost:3000"),
  /** `local` writes to UPLOAD_DIR and serves it from the API (dev only); `r2` uses Cloudflare R2. */
  STORAGE_DRIVER: z.enum(["local", "r2"]).default("local"),
  UPLOAD_DIR: z.string().min(1).default("uploads"),
  R2_ACCOUNT_ID: z.string().min(1).optional(),
  R2_ACCESS_KEY_ID: z.string().min(1).optional(),
  R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  R2_BUCKET: z.string().min(1).optional(),
  /** Public base URL that stored files are served from, without a trailing slash. */
  PUBLIC_ASSET_BASE_URL: url("PUBLIC_ASSET_BASE_URL")
    .transform((value) => value.replace(/\/+$/, ""))
    .default("http://localhost:4000/v1/assets/files"),
});

const DEV_SESSION_SECRET = "dev-only-session-secret-change-me-0123456789";

const R2_KEYS = ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET"] as const;

const EnvSchema = EnvObjectSchema.superRefine((env, ctx) => {
  if (env.NODE_ENV === "production" && !env.SESSION_SECRET) {
    ctx.addIssue({
      code: "custom",
      path: ["SESSION_SECRET"],
      message: "SESSION_SECRET is required in production",
    });
  }
  if (env.STORAGE_DRIVER === "local" && env.NODE_ENV === "production") {
    ctx.addIssue({
      code: "custom",
      path: ["STORAGE_DRIVER"],
      message: "STORAGE_DRIVER=local is for development only",
    });
  }
  if (env.STORAGE_DRIVER === "r2") {
    for (const key of R2_KEYS) {
      if (!env[key])
        ctx.addIssue({
          code: "custom",
          path: [key],
          message: `${key} is required when STORAGE_DRIVER=r2`,
        });
    }
  }
}).transform((env) => ({ ...env, SESSION_SECRET: env.SESSION_SECRET ?? DEV_SESSION_SECRET }));

export type Env = z.output<typeof EnvSchema>;

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
