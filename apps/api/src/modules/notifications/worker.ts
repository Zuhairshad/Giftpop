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
