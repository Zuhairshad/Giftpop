import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

import { isApiError } from "@/lib/api";

export interface FieldError {
  /** Dotted path into the form values, for example `shipping.flatMinor`. */
  path: string;
  message: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Reads zod-style issues (`[{ path: ["shipping", "flatMinor"], message }]`) from an
 * API error's `details`. Anything else gives an empty list.
 */
export function fieldErrorsFromDetails(details: unknown): FieldError[] {
  const issues = isRecord(details) && Array.isArray(details.issues) ? details.issues : details;
  if (!Array.isArray(issues)) return [];

  const found: FieldError[] = [];
  for (const issue of issues) {
    if (!isRecord(issue) || typeof issue.message !== "string") continue;
    const path = Array.isArray(issue.path)
      ? issue.path.filter((part) => typeof part === "string" || typeof part === "number").join(".")
      : "";
    if (path !== "") found.push({ path, message: issue.message });
  }
  return found;
}

export interface ReadableApiError {
  message: string;
  fields: FieldError[];
}

/** What to show for any thrown value: one sentence, plus field errors when the API gave them. */
export function readApiError(error: unknown): ReadableApiError {
  if (isApiError(error)) {
    const fields = fieldErrorsFromDetails(error.details);
    const message =
      error.status === 403
        ? "Your account is not allowed to do this."
        : error.status === 401
          ? "Your session has ended. Sign in again."
          : error.message;
    return { message, fields };
  }
  return { message: "Something went wrong. Try again.", fields: [] };
}

/**
 * Puts an API failure on the form: field errors on their inputs, and the returned
 * sentence for an alert above the buttons.
 */
export function applyApiError<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
): string {
  const { message, fields } = readApiError(error);
  for (const field of fields) {
    setError(field.path as Path<T>, { type: "server", message: field.message });
  }
  return message;
}
