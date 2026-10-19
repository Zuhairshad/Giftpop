import { pino, type Logger } from "pino";

import type { Env } from "./env";

export type { Logger };

export function createLogger(env: Pick<Env, "LOG_LEVEL" | "NODE_ENV">): Logger {
  return pino({
    level: env.NODE_ENV === "test" && env.LOG_LEVEL === "info" ? "silent" : env.LOG_LEVEL,
    redact: ["req.headers.authorization", "req.headers.cookie", 'res.headers["set-cookie"]'],
  });
}
