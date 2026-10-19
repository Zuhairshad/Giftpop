import { MemoryStore } from "express-rate-limit";

export const PARTNER_REQUESTS_PER_HOUR = 3;
export const PARTNER_WINDOW_MS = 3_600_000;

/** The store behind the default partner-request limiter, exposed so tests can reset it. */
export const defaultPartnerStore = new MemoryStore();

export function resetPartnerRateLimit(): void {
  defaultPartnerStore.resetAll();
}
