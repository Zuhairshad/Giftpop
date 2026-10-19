import { createApp } from "./app";
import { connectDb, disconnectDb } from "./db";
import { EnvError, parseEnv } from "./env";
import { createLogger } from "./logger";

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

  await connectDb({
    uri: env.MONGODB_URI,
    maxAttempts: env.DB_CONNECT_MAX_ATTEMPTS,
    baseDelayMs: env.DB_CONNECT_BASE_DELAY_MS,
    logger,
  });

  const app = createApp({ env, logger });
  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, "API listening");
  });

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
    server.close((closeError) => {
      disconnectDb()
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
