import { MemoryStore } from "express-rate-limit";

export const SAVES_PER_MINUTE = 20;

/** The store behind the default save limiter, exposed so tests can reset it. */
export const defaultSaveStore = new MemoryStore();

export function resetSaveRateLimit(): void {
  defaultSaveStore.resetAll();
}
