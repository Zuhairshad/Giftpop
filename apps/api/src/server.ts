import mongoose from "mongoose";

import { createApp } from "./app";
import { connectDb, disconnectDb } from "./db";
import { EnvError, parseEnv } from "./env";
import { flushObservability, initObservability } from "./lib/observability/sentry";
import { createLogger } from "./logger";
import { shouldRunWorker, startNotificationsWorker } from "./modules/notifications/worker";

function loadDotEnv(): void {
  try {
    process.loadEnvFile();
  } catch {
    // No .env file: real environment variables only.
  }
}

async function main(): Promise<void> {
  loadDotEnv();
  const env = parseEnv(process.env);
  const logger = createLogger(env);
  await initObservability(env);

  await connectDb({
    uri: env.MONGODB_URI,
    maxAttempts: env.DB_CONNECT_MAX_ATTEMPTS,
    baseDelayMs: env.DB_CONNECT_BASE_DELAY_MS,
    logger,
  });

  // Dashboard queries hint their indexes, so they must exist before traffic arrives.
  await Promise.all(Object.values(mongoose.models).map((model) => model.init()));

  const app = createApp({ env, logger });
  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, "API listening");
  });

  const worker = shouldRunWorker(env.NOTIFICATIONS_WORKER)
    ? startNotificationsWorker({
        intervalMs: 5000,
        logger,
        trackBaseUrl: env.WEB_ORIGIN,
        onError: (error: unknown) => logger.error({ err: error }, "notifications worker"),
      })
    : undefined;

  let shuttingDown = false;
  const shutdown = (signal: string): void => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, "Shutting down");
    const forceExit = setTimeout(() => {
      logger.error("Shutdown timed out, forcing exit");
      process.exit(1);
    }, 10_000);
    forceExit.unref();
    worker?.stop();
    server.close((closeError) => {
      flushObservability()
        .then(() => disconnectDb())
        .catch((dbError: unknown) => logger.error({ err: dbError }, "Error closing MongoDB"))
        .finally(() => process.exit(closeError ? 1 : 0));
    });
    server.closeIdleConnections();
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((error: unknown) => {
  if (error instanceof EnvError) {
    console.error(error.message);
  } else {
    console.error("API failed to start", error);
  }
  process.exit(1);
});
