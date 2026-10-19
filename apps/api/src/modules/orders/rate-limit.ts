import { MemoryStore } from "express-rate-limit";

export const TRACKS_PER_MINUTE = 10;

/** The store behind the default tracking limiter, exposed so tests can reset it. */
export const defaultTrackStore = new MemoryStore();

export function resetTrackRateLimit(): void {
  defaultTrackStore.resetAll();
}
