import { StatusChangeRequestSchema } from "@giftpop/contracts";
import type { OrderStatus, StatusChangeRequest } from "@giftpop/contracts";

import { actionFor } from "./action-labels";

export interface StatusFormValues {
  note: string;
  courier: string;
  trackingNumber: string;
  trackingUrl: string;
  reason: string;
}

export const EMPTY_STATUS_VALUES: StatusFormValues = {
  note: "",
  courier: "",
  trackingNumber: "",
  trackingUrl: "",
  reason: "",
};

export type StatusFieldName = keyof StatusFormValues;

export type StatusValidation =
  | { ok: true; request: StatusChangeRequest }
  | { ok: false; errors: Partial<Record<StatusFieldName, string>> };

const REQUIRED_MESSAGES: Partial<Record<StatusFieldName, string>> = {
  courier: "Enter the courier's name",
  trackingNumber: "Enter the tracking number",
  reason: "Say why this order is being cancelled",
};
const URL_MESSAGE = "Enter a full link starting with http:// or https://";

function isStatusField(name: unknown): name is StatusFieldName {
  return typeof name === "string" && name in EMPTY_STATUS_VALUES;
}

function hasWebProtocol(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Builds the request body for one target status. Only the fields that status uses are
 * sent, trimmed, and blanks are left out, so the API never sees a stray empty string.
 */
export function buildStatusRequest(to: OrderStatus, values: StatusFormValues): StatusChangeRequest {
  const kind = actionFor(to).dialog;
  const request: StatusChangeRequest = { to };
  if (kind === "ship") {
    request.courier = values.courier.trim();
    request.trackingNumber = values.trackingNumber.trim();
    const url = values.trackingUrl.trim();
    if (url !== "") request.trackingUrl = url;
  }
  if (kind === "cancel") request.reason = values.reason.trim();
  const note = values.note.trim();
  if (kind !== "cancel" && note !== "") request.note = note;
  return request;
}

/** Validates with the contract, then adds the one rule it lacks: tracking links are http(s) only. */
export function validateStatusForm(to: OrderStatus, values: StatusFormValues): StatusValidation {
  const request = buildStatusRequest(to, values);
  const errors: Partial<Record<StatusFieldName, string>> = {};
  const parsed = StatusChangeRequestSchema.safeParse(request);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (!isStatusField(field) || errors[field]) continue;
      const blank = (request[field] ?? "") === "";
      errors[field] =
        (blank ? REQUIRED_MESSAGES[field] : undefined) ??
        (field === "trackingUrl" ? URL_MESSAGE : "This is too long or not valid");
    }
  }
  if (
    request.trackingUrl !== undefined &&
    !errors.trackingUrl &&
    !hasWebProtocol(request.trackingUrl)
  ) {
    errors.trackingUrl = URL_MESSAGE;
  }
  if (parsed.success && Object.keys(errors).length === 0) return { ok: true, request: parsed.data };
  return { ok: false, errors };
}
