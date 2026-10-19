import { MemoryStore } from "express-rate-limit";

export const TRACKS_PER_MINUTE = 10;
export const ORDERS_PER_MINUTE = 20;

/** The store behind the default tracking limiter, exposed so tests can reset it. */
export const defaultTrackStore = new MemoryStore();

export function resetTrackRateLimit(): void {
  defaultTrackStore.resetAll();
}

/** The store behind the default order-placing limiter, exposed so tests can reset it. */
export const defaultOrderStore = new MemoryStore();

export function resetOrderRateLimit(): void {
  defaultOrderStore.resetAll();
}
