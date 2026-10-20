import { MemoryStore } from "express-rate-limit";

export const SAVES_PER_MINUTE = 20;
export const VIEWS_PER_MINUTE = 60;

/** The store behind the default save limiter, exposed so tests can reset it. */
export const defaultSaveStore = new MemoryStore();
/** The store behind the default shared-design view limiter, exposed so tests can reset it. */
export const defaultViewStore = new MemoryStore();

export function resetSaveRateLimit(): void {
  defaultSaveStore.resetAll();
}

export function resetViewRateLimit(): void {
  defaultViewStore.resetAll();
}
