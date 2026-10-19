import { parseEnv } from "../../env";

export interface AuthConfig {
  /** Peppers the hash of session tokens. */
  sessionSecret: string;
  /** Cookies carry the Secure flag in production. */
  secureCookies: boolean;
}

let cached: AuthConfig | undefined;

/**
 * Reads the shared env schema once so the secret, its dev default and the production
 * rule stay defined in one place. `MONGODB_URI` is not needed here, so a placeholder
 * stands in when it is unset (tests); the server has already validated the real value.
 */
export function getAuthConfig(): AuthConfig {
  if (!cached) {
    const env = parseEnv({ MONGODB_URI: "mongodb://unused", ...process.env });
    cached = { sessionSecret: env.SESSION_SECRET, secureCookies: env.NODE_ENV === "production" };
  }
  return cached;
}
