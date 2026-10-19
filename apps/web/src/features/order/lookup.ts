import {
  OrderNumberSchema,
  PublicOrderViewSchema,
  TrackOrderRequestSchema,
} from "@giftpop/contracts";
import type { PublicOrderView, TrackOrderRequest } from "@giftpop/contracts";

import { ApiError, ApiNetworkError, apiRequest } from "@/lib/api";

export const NOT_FOUND_MESSAGE =
  "We could not find an order with those details. Check the order number and the phone or email you used.";

export type LookupInput = { number: string; contact: string };
export type LookupFieldErrors = { number?: string; contact?: string };

/** Upper-cases and trims what the visitor typed, then checks it with the contract schemas. */
export function parseLookupInput(
  input: LookupInput,
): { ok: true; value: TrackOrderRequest } | { ok: false; errors: LookupFieldErrors } {
  const number = input.number.replace(/\s+/g, "").toUpperCase();
  const errors: LookupFieldErrors = {};
  if (!OrderNumberSchema.safeParse(number).success) {
    errors.number = "Enter the order number like GP-PK-7K2M9Q.";
  }
  const request = TrackOrderRequestSchema.safeParse({ number, contact: input.contact });
  if (!request.success && request.error.issues.some((issue) => issue.path[0] === "contact")) {
    errors.contact = "Enter the phone number or email you used to order.";
  }
  if (errors.number || errors.contact || !request.success) return { ok: false, errors };
  return { ok: true, value: request.data };
}

export function lookupOrder(
  request: TrackOrderRequest,
  signal?: AbortSignal,
): Promise<PublicOrderView> {
  return apiRequest("/orders/track", PublicOrderViewSchema, {
    method: "POST",
    body: request,
    signal,
  });
}

export type LookupFailure = {
  kind: "not_found" | "rate_limited" | "network" | "other";
  message: string;
};

export function describeLookupError(error: unknown): LookupFailure {
  if (error instanceof ApiError && error.status === 404) {
    return { kind: "not_found", message: NOT_FOUND_MESSAGE };
  }
  if (error instanceof ApiError && error.status === 429) {
    return { kind: "rate_limited", message: "Too many tries. Wait a minute, then try again." };
  }
  if (error instanceof ApiNetworkError) return { kind: "network", message: error.message };
  return { kind: "other", message: "Something went wrong on our side. Try again in a moment." };
}
