import { processOutbox, type ProcessOptions } from "./service";

export interface WorkerOptions extends Omit<ProcessOptions, "now"> {
  intervalMs?: number;
  /** Called when a run throws (for example the database is down). The worker keeps going. */
  onError?: (error: unknown) => void;
}

/** True only for the exact value "on" (the `NOTIFICATIONS_WORKER` env var). */
export function shouldRunWorker(value: string | undefined): boolean {
  return value === "on";
}

/**
 * A production API with the worker off sends no customer messages and nothing fails, so boot
 * warns. Returns the warning, or null when there is nothing to say. Exactly one instance runs it.
 */
export function workerOffWarning(env: {
  NODE_ENV: string;
  NOTIFICATIONS_WORKER: string;
}): string | null {
  if (env.NODE_ENV !== "production" || shouldRunWorker(env.NOTIFICATIONS_WORKER)) return null;
  return "NOTIFICATIONS_WORKER is off: no customer emails or messages will be sent. Set it to on in exactly one API instance.";
}

/** Runs `processOutbox` every `intervalMs`, never two runs at once. */
export function startNotificationsWorker(options: WorkerOptions = {}): { stop(): void } {
  const { intervalMs = 5_000, onError, ...processOptions } = options;
  let running = false;
  let stopped = false;

  const timer = setInterval(() => {
    if (running || stopped) return;
    running = true;
    processOutbox(processOptions)
      .catch((error: unknown) => onError?.(error))
      .finally(() => {
        running = false;
      });
  }, intervalMs);
  timer.unref();

  return {
    stop() {
      stopped = true;
      clearInterval(timer);
    },
  };
}
