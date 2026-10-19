import mongoose from "mongoose";

import type { Logger } from "./logger";

export interface ConnectOptions {
  uri: string;
  maxAttempts: number;
  baseDelayMs: number;
  logger?: Logger;
  /** Passed to the driver; lower it in tests so a dead server fails fast. */
  serverSelectionTimeoutMs?: number;
}

const MAX_DELAY_MS = 10_000;

/** Exponential backoff: base, 2x base, 4x base ... capped at 10 seconds. `attempt` starts at 1. */
export function backoffDelay(attempt: number, baseDelayMs: number): number {
  return Math.min(baseDelayMs * 2 ** (attempt - 1), MAX_DELAY_MS);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Connect to MongoDB, retrying with backoff. Throws the last error after `maxAttempts`. */
export async function connectDb(options: ConnectOptions): Promise<void> {
  const { uri, maxAttempts, baseDelayMs, logger, serverSelectionTimeoutMs = 5_000 } = options;
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: serverSelectionTimeoutMs });
      logger?.info("MongoDB connected");
      return;
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts) break;
      const delayMs = backoffDelay(attempt, baseDelayMs);
      logger?.warn(
        { err: error, attempt, maxAttempts, delayMs },
        "MongoDB connect failed, retrying",
      );
      await sleep(delayMs);
    }
  }
  throw lastError instanceof Error ? lastError : new Error("MongoDB connection failed");
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}

/** True when mongoose has an open connection. Used by `/ready`. */
export function isDbReady(): boolean {
  return mongoose.connection.readyState === mongoose.ConnectionStates.connected;
}

/**
 * Whether the database answers a `ping` within `timeoutMs`. Mongoose can still report
 * "connected" for a while after the server or the network went away, so `/ready` asks.
 */
export async function pingDb(timeoutMs = 2000): Promise<boolean> {
  const db = mongoose.connection.db;
  if (!isDbReady() || !db) return false;
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<false>((resolve) => {
    timer = setTimeout(() => resolve(false), timeoutMs);
  });
  const ping = db
    .command({ ping: 1 })
    .then(() => true)
    .catch(() => false);
  try {
    return await Promise.race([ping, timeout]);
  } finally {
    clearTimeout(timer);
  }
}
