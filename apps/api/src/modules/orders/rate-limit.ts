import { MemoryStore } from "express-rate-limit";

export const TRACKS_PER_MINUTE = 10;
export const ORDERS_PER_MINUTE = 20;
export const LOOKUPS_PER_MINUTE = 3;

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

/** The store behind the default "forgot your order number" limiter, exposed so tests can reset it. */
export const defaultLookupStore = new MemoryStore();

export function resetLookupRateLimit(): void {
  defaultLookupStore.resetAll();
}
