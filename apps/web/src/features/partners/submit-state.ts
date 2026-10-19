import type { PartnerRequestKind } from "@giftpop/contracts";
import { z } from "zod";

import type { PartnerFieldErrors, PartnerFieldName } from "./fields";
import { issueField } from "./request";

import { ApiError, ApiNetworkError } from "@/lib/api-errors";

export type SubmitFailure =
  | { kind: "fields"; fields: PartnerFieldErrors }
  | { kind: "rate_limited" }
  | { kind: "offline" }
  | { kind: "generic" };

export type SubmitState =
  { status: "idle"; failure?: SubmitFailure } | { status: "sending" } | { status: "success" };

export type SubmitAction =
  { type: "submit" } | { type: "succeeded" } | { type: "failed"; failure: SubmitFailure };

export const INITIAL_SUBMIT_STATE: SubmitState = { status: "idle" };

/** One request at a time, and no way back to the form once it has gone through. */
export function submitReducer(state: SubmitState, action: SubmitAction): SubmitState {
  switch (action.type) {
    case "submit":
      return state.status === "idle" ? { status: "sending" } : state;
    case "succeeded":
      return state.status === "sending" ? { status: "success" } : state;
    case "failed":
      return state.status === "sending" ? { status: "idle", failure: action.failure } : state;
  }
}

/** The API sends zod issues (`path`) or `{ field }` entries; both name a field. */
const DetailsSchema = z.array(
  z.object({
    path: z.array(z.union([z.string(), z.number()])).optional(),
    field: z.string().optional(),
  }),
);

export function mapDetailsToFields(
  kind: PartnerRequestKind,
  details: unknown,
  messageFor: (name: PartnerFieldName) => string,
): PartnerFieldErrors {
  const parsed = DetailsSchema.safeParse(details);
  const fields: PartnerFieldErrors = {};
  if (!parsed.success) return fields;
  for (const entry of parsed.data) {
    const name = issueField(kind, entry.path?.[0] ?? entry.field?.split(".")[0]);
    if (name && fields[name] === undefined) fields[name] = messageFor(name);
  }
  return fields;
}

/** Sorts what the request threw into something the form can say in plain words (never raw API text). */
export function classifySubmitError(
  kind: PartnerRequestKind,
  error: unknown,
  messageFor: (name: PartnerFieldName) => string,
): SubmitFailure {
  if (error instanceof ApiNetworkError) return { kind: "offline" };
  if (!(error instanceof ApiError)) return { kind: "generic" };
  if (error.status === 429 || error.code === "RATE_LIMITED") return { kind: "rate_limited" };
  if (error.code === "VALIDATION_ERROR") {
    const fields = mapDetailsToFields(kind, error.details, messageFor);
    if (Object.keys(fields).length > 0) return { kind: "fields", fields };
  }
  return { kind: "generic" };
}

export function failureMessage(failure: SubmitFailure): string {
  switch (failure.kind) {
    case "fields":
      return "Some details need another look. Please check the highlighted fields.";
    case "rate_limited":
      return "You have sent a few requests already. Please try again later.";
    case "offline":
      return "We could not reach the server. Check your connection and try again.";
    case "generic":
      return "Something went wrong and your request was not sent. Please try again.";
  }
}

export const SUCCESS_MESSAGE =
  "Thank you. We read every request and will reply by email within a few days.";
