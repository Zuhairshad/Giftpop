import { MemoryStore } from "express-rate-limit";

export const TEMPLATE_STARTS_PER_MINUTE = 30;

/** The store behind the default start limiter, exposed so tests can reset it. */
export const defaultStartStore = new MemoryStore();

export function resetStartRateLimit(): void {
  defaultStartStore.resetAll();
}
