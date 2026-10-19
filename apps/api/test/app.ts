import type { Express } from "express";

import { createApp } from "../src/app";
import { parseEnv } from "../src/env";
import { createLogger } from "../src/logger";
import type { ApiModule } from "../src/modules";

/** Build the app with test env (silent logs). Pass `modules` to mount test routers. */
export function createTestApp(modules?: ApiModule[]): Express {
  const env = parseEnv({
    NODE_ENV: "test",
    MONGODB_URI: "mongodb://localhost:27017/giftpop_test",
    CORS_ORIGINS: "http://localhost:3000",
  });
  return createApp({ env, logger: createLogger(env), modules });
}
